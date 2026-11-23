"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { toMasterBody, validateMaster, tabByKind, type MasterInput } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const urutOk = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;
const tidakValid = () => errorResult("VALIDATION_ERROR", "Data tidak valid.");

// A-01…A-03 — buat/ubah data master. Galat 409 (nama kembar) dari backend diteruskan apa adanya.
export async function simpanMaster(kind: string, id: number | null, input: unknown): Promise<ActionResult<MasterItem>> {
  await requireAdmin();
  if (!tabByKind(kind) || (id !== null && !idOk(id))) return tidakValid();
  const masalah = validateMaster(kind, input);
  if (Object.keys(masalah).length > 0) return fieldErrorResult(masalah, "Periksa kembali isian.");
  const body = JSON.stringify(toMasterBody(kind, input as MasterInput));
  return toResult(
    await adminFetch<MasterItem>(id === null ? `/master/${kind}` : `/master/${kind}/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function setAktifMaster(kind: string, id: number, aktif: boolean): Promise<ActionResult<MasterItem>> {
  await requireAdmin();
  if (!tabByKind(kind) || !idOk(id) || typeof aktif !== "boolean") return tidakValid();
  return toResult(
    await adminFetch<MasterItem>(`/master/${kind}/${id}/${aktif ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}

type Urutan = { id: number; sort_order: number };

/** Tukar sort_order dua item (nilai harus beda, agar urutan pasti berubah) bertetangga (dua PATCH berurutan). Bila yang kedua gagal, yang pertama dikembalikan. */
export async function tukarUrutan(kind: string, a: Urutan, b: Urutan): Promise<ActionResult<null>> {
  await requireAdmin();
  const t = tabByKind(kind);
  if (
    !t?.sortable ||
    !a ||
    !b ||
    !idOk(a.id) ||
    !idOk(b.id) ||
    a.id === b.id ||
    !urutOk(a.sort_order) ||
    !urutOk(b.sort_order) ||
    a.sort_order === b.sort_order
  )
    return tidakValid();
  const patch = (id: number, sort_order: number) =>
    adminFetch<null>(`/master/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ sort_order }) });
  const r1 = await patch(a.id, b.sort_order);
  if (!r1.ok) return toResult(r1);
  const r2 = await patch(b.id, a.sort_order);
  if (!r2.ok) {
    await patch(a.id, a.sort_order).catch(() => undefined);
    return toResult(r2);
  }
  return { data: null };
}
