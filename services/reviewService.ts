import "server-only";
import { reviews } from "@/lib/fixtures/reviews";
import type { DataResult } from "@/types/api";
import type { Review } from "@/types/review";
import { baca, kosongkan } from "@/lib/baca";

// shortcut: data contoh sampai F13 (GET /merchant/reviews)
export async function getReviews(): Promise<DataResult<Review[]>> {
  return baca((s) => (kosongkan(s) ? [] : reviews()));
}
