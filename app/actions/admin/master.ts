"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { toMasterBody, validateMaster, tabByKind, type MasterInput } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const isValidSortOrder = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;
const invalidDataError = () => errorResult("VALIDATION_ERROR", "Data tidak valid.");

// A-01…A-03 — buat/ubah data master. Galat 409 (nama kembar) dari backend diteruskan apa adanya.
export async function saveMaster(kind: string, id: number | null, input: unknown): Promise<ActionResult<MasterItem>> {
  await requireAdmin();
  if (!tabByKind(kind) || (id !== null && !isValidId(id))) return invalidDataError();
  const errors = validateMaster(kind, input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali isian.");
  const body = JSON.stringify(toMasterBody(kind, input as MasterInput));
  return toResult(
    await adminFetch<MasterItem>(id === null ? `/master/${kind}` : `/master/${kind}/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function setMasterActive(kind: string, id: number, active: boolean): Promise<ActionResult<MasterItem>> {
  await requireAdmin();
  if (!tabByKind(kind) || !isValidId(id) || typeof active !== "boolean") return invalidDataError();
  return toResult(
    await adminFetch<MasterItem>(`/master/${kind}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}

type SortOrderItem = { id: number; sort_order: number };

/** Tukar sort_order dua item (nilai harus beda, agar urutan pasti berubah) bertetangga (dua PATCH berurutan). Bila yang kedua gagal, yang pertama dikembalikan. */
export async function swapSortOrder(
  kind: string,
  first: SortOrderItem,
  second: SortOrderItem,
): Promise<ActionResult<null>> {
  await requireAdmin();
  const tab = tabByKind(kind);
  if (
    !tab?.sortable ||
    !first ||
    !second ||
    !isValidId(first.id) ||
    !isValidId(second.id) ||
    first.id === second.id ||
    !isValidSortOrder(first.sort_order) ||
    !isValidSortOrder(second.sort_order) ||
    first.sort_order === second.sort_order
  )
    return invalidDataError();
  const patchSortOrder = (id: number, sortOrder: number) =>
    adminFetch<null>(`/master/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ sort_order: sortOrder }) });
  const firstResult = await patchSortOrder(first.id, second.sort_order);
  if (!firstResult.ok) return toResult(firstResult);
  const secondResult = await patchSortOrder(second.id, first.sort_order);
  if (!secondResult.ok) {
    await patchSortOrder(first.id, first.sort_order).catch(() => undefined);
    return toResult(secondResult);
  }
  return { data: null };
}
