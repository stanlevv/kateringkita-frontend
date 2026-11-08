import "server-only";
import { promos } from "@/lib/fixtures/promos";
import type { DataResult } from "@/types/api";
import type { Promo } from "@/types/promo";
import { baca, kosongkan } from "@/lib/baca";

// shortcut: data contoh sampai F12 (GET /merchant/promos)
export async function getPromos(): Promise<DataResult<Promo[]>> {
  return baca((s) => (kosongkan(s) ? [] : promos()));
}
