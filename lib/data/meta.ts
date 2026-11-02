import "server-only";
import { apiFetch, hasil } from "../api";
import { getSkenario } from "../skenario";
import type { Category, DataResult, PickupPoint } from "../types";

export async function getCategories(): Promise<DataResult<Category[]>> {
  if ((await getSkenario()) === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  return hasil(await apiFetch<Category[]>("/meta/categories"));
}

export async function getPickupPoints(): Promise<DataResult<PickupPoint[]>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (s === "penjual-baru") return { data: [] };
  return hasil(await apiFetch<PickupPoint[]>("/meta/pickup-points"));
}
