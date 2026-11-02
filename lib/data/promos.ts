import "server-only";
import { promos } from "../fixtures/promos";
import type { DataResult, Promo } from "../types";
import { baca, kosongkan } from "./baca";

// shortcut: data contoh sampai F12 (GET /merchant/promos)
export async function getPromos(): Promise<DataResult<Promo[]>> {
  return baca((s) => (kosongkan(s) ? [] : promos()));
}
