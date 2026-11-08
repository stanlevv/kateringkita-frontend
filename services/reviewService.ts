import "server-only";
import { hasil, merchantFetch } from "@/services/api";
import { getSkenario } from "@/lib/skenario";
import type { DataResult } from "@/types/api";
import type { Review } from "@/types/review";

// F13: GET /merchant/reviews; skenario /pratinjau (dev) ditumpuk seperti getMenus
export async function getReviews(): Promise<DataResult<Review[]>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (s === "kosong" || s === "penjual-baru") return { data: [] };
  return hasil(await merchantFetch<Review[]>("/reviews"));
}
