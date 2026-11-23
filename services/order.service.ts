import "server-only";

// Data pesanan penjual dari backend (GET /merchant/orders): daftar, antrean dashboard, perubahan terbaru, dan detail.
// Skenario /pratinjau (hanya mode pengembangan) bisa memaksa hasil kosong atau gagal tanpa memanggil backend.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { cache } from "react";
import { toResult, merchantFetch } from "@/services/api";
import { todayWib } from "@/lib/format";
import { newOrder } from "@/lib/fixtures/orders";
import { LIMIT_ORDERS } from "@/lib/order-filter";
import { getScenario } from "@/lib/scenario";
import type { ApiError, DataResult } from "@/types/api";
import type { MerchantOrder, OrderStatus } from "@/types/order";

// Hasil galat yang dipakai bila skenario /pratinjau memaksa "gagal memuat".
const LOAD_FAILED: { error: ApiError } = {
  error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." },
};
const totalFromMeta = (meta: unknown) => (meta as { total?: number } | undefined)?.total ?? 0;

/** Penyaring daftar pesanan: status, tanggal (YYYY-MM-DD), kata pencarian, dan halaman. */
export type OrderListFilter = { status?: OrderStatus; date?: string; q?: string; page?: number };

/**
 * Mengambil satu halaman daftar pesanan; penyaringan dan pembagian halaman dikerjakan server.
 * @param filter penyaring
 * @returns `{ data: { rows, total } }` atau `{ error }`
 */
export async function getOrders(
  filter: OrderListFilter = {},
): Promise<DataResult<{ rows: MerchantOrder[]; total: number }>> {
  // 1. Skenario pratinjau bisa memaksa gagal atau kosong tanpa memanggil backend.
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: { rows: [], total: 0 } };
  // 2. Susun query dari penyaring yang diisi saja.
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.date) params.set("date", filter.date);
  if (filter.q) params.set("q", filter.q);
  if (filter.page) params.set("page", String(filter.page));
  params.set("limit", String(LIMIT_ORDERS));
  // 3. Panggil backend; total diambil dari `meta` paginasi.
  const response = await merchantFetch<MerchantOrder[]>(`/orders?${params}`);
  return response.ok && response.data
    ? { data: { rows: response.data, total: totalFromMeta(response.meta) } }
    : (toResult(response) as { error: ApiError });
}

/**
 * Mengambil antrean dashboard: semua pesanan yang masih berjalan ditambah semua pesanan hari ini (tanpa duplikat).
 * Dibungkus `cache()` agar dalam satu permintaan cukup dipanggil sekali.
 * @returns `{ data }` atau `{ error }`
 */
// shortcut: maks 100 per panggilan; tambah pagination antrean bila toko > 100 pesanan aktif/hari
export const getQueue = cache(async (): Promise<DataResult<MerchantOrder[]>> => {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  // 1. Ambil pesanan yang masih berjalan dan pesanan hari ini secara bersamaan.
  const [activeResult, todayResult] = await Promise.all([
    merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed,cooking,ready&limit=100"),
    merchantFetch<MerchantOrder[]>(`/orders?date=${todayWib()}&limit=100`),
  ]);
  // 2. Salah satu gagal -> kembalikan galatnya.
  for (const result of [activeResult, todayResult])
    if (!result.ok || !result.data) return toResult(result) as { error: ApiError };
  // 3. Gabungkan per kode agar pesanan yang muncul di kedua daftar hanya tampil sekali.
  const byCode = new Map(
    [...(activeResult.data ?? []), ...(todayResult.data ?? [])].map((order) => [order.code, order]),
  );
  return { data: [...(scenario === "pesanan-baru" ? [newOrder()] : []), ...byCode.values()] };
});

/**
 * Mengambil pesanan yang berubah sejak waktu tertentu (dipakai polling dashboard: permintaan berkala setiap beberapa detik).
 * Halaman berikutnya diambil dengan `updated_at` terbesar, bukan nomor halaman, paling banyak 5 kali agar tidak berputar terus.
 * Kode yang muncul dua kali memakai versi terakhir.
 * @param since waktu ISO; hanya pesanan dengan `updated_at` setelah ini
 * @returns `{ data }` atau `{ error }`
 */
export async function getChangedOrders(since: string): Promise<DataResult<MerchantOrder[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat" || scenario === "gagal-sinkron") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  // 1. Ambil per 100 pesanan, mulai dari `since`.
  const byCode = new Map<string, MerchantOrder>();
  let cursor = since;
  for (let round = 0; round < 5; round++) {
    const response = await merchantFetch<MerchantOrder[]>(
      `/orders?${new URLSearchParams({ updated_since: cursor, limit: "100" })}`,
    );
    if (!response.ok || !response.data) return toResult(response) as { error: ApiError };
    // 2. Simpan per kode (versi terakhir menang), lalu majukan `cursor` ke `updated_at` terbesar.
    for (const order of response.data) byCode.set(order.code, order);
    const latest = response.data.reduce(
      (latestSoFar, order) => (Date.parse(order.updated_at) > Date.parse(latestSoFar) ? order.updated_at : latestSoFar),
      cursor,
    );
    // 3. Berhenti bila halaman tidak penuh atau `updated_at` tidak maju lagi.
    if (response.data.length < 100 || Date.parse(latest) <= Date.parse(cursor)) break;
    cursor = latest;
  }
  return { data: [...byCode.values()] };
}

/**
 * Jumlah pesanan menunggu dan terkonfirmasi untuk badge sidebar. Bila gagal dianggap 0.
 * @returns jumlah pesanan yang perlu ditindak
 */
export async function getNeedsActionCount(): Promise<number> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat" || scenario === "kosong" || scenario === "penjual-baru") return 0;
  const response = await merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed&limit=1");
  return (response.ok ? totalFromMeta(response.meta) : 0) + (scenario === "pesanan-baru" ? 1 : 0);
}

/**
 * Mengambil satu pesanan berdasarkan kode.
 * @param code kode pesanan, mis. "KK-20261031-7QF2"
 * @returns `{ data }` atau `{ error }` (mis. NOT_FOUND)
 */
export async function getOrder(code: string): Promise<DataResult<MerchantOrder>> {
  return toResult(await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}`));
}
