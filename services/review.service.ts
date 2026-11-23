import "server-only";
import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { Review } from "@/types/review";

// F13: GET /merchant/reviews; skenario /pratinjau (dev) ditumpuk seperti getMenus
export async function getReviews(): Promise<DataResult<Review[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<Review[]>("/reviews"));
}
