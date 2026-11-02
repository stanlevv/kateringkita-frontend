import "server-only";
import { reviews } from "../fixtures/reviews";
import type { DataResult, Review } from "../types";
import { baca, kosongkan } from "./baca";

// shortcut: data contoh sampai F13 (GET /merchant/reviews)
export async function getReviews(): Promise<DataResult<Review[]>> {
  return baca((s) => (kosongkan(s) ? [] : reviews()));
}
