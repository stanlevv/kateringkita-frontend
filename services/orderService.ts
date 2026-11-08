import "server-only";
import { cache } from "react";
import { hasil, merchantFetch } from "@/services/api";
import { hariIniWib } from "@/lib/format";
import { pesananBaru } from "@/lib/fixtures/orders";
import { LIMIT_PESANAN } from "@/lib/order-filter";
import { getSkenario } from "@/lib/skenario";
import type { ApiError, DataResult } from "@/types/api";
import type { MerchantOrder, OrderStatus } from "@/types/order";

// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan (F04 D18).
const GAGAL_MUAT: { error: ApiError } = { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
const total = (meta: unknown) => (meta as { total?: number } | undefined)?.total ?? 0;

export type FilterDaftar = { status?: OrderStatus; tanggal?: string; q?: string; page?: number };

/** Satu halaman daftar pesanan (M-04); filter dan halaman diproses server (D16). */
export async function getOrders(f: FilterDaftar = {}): Promise<DataResult<{ rows: MerchantOrder[]; total: number }>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return GAGAL_MUAT;
  if (s === "kosong" || s === "penjual-baru") return { data: { rows: [], total: 0 } };
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.tanggal) p.set("date", f.tanggal);
  if (f.q) p.set("q", f.q);
  if (f.page) p.set("page", String(f.page));
  p.set("limit", String(LIMIT_PESANAN));
  const res = await merchantFetch<MerchantOrder[]>(`/orders?${p}`);
  return res.ok && res.data ? { data: { rows: res.data, total: total(res.meta) } } : hasil(res) as { error: ApiError };
}

/** Antrean dashboard: semua yang masih aktif + semua pesanan hari ini, kode sama sekali (D16). */
// shortcut: maks 100 per panggilan; tambah pagination antrean bila toko > 100 pesanan aktif/hari
export const getAntrean = cache(async (): Promise<DataResult<MerchantOrder[]>> => {
  const s = await getSkenario();
  if (s === "gagal-muat") return GAGAL_MUAT;
  if (s === "kosong" || s === "penjual-baru") return { data: [] };
  const [aktif, hariIni] = await Promise.all([
    merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed,cooking,ready&limit=100"),
    merchantFetch<MerchantOrder[]>(`/orders?date=${hariIniWib()}&limit=100`),
  ]);
  for (const r of [aktif, hariIni]) if (!r.ok || !r.data) return hasil(r) as { error: ApiError };
  const unik = new Map([...(aktif.data ?? []), ...(hariIni.data ?? [])].map((o) => [o.code, o]));
  return { data: [...(s === "pesanan-baru" ? [pesananBaru()] : []), ...unik.values()] };
});

/**
 * M-04, D3/D4: pesanan yang berubah sejak `sejak`. Maju memakai `updated_at` terbesar (API §1), bukan `page`,
 * maks 5 putaran agar tidak berputar; kode sama di dua putaran -> versi terakhir.
 */
export async function getPerubahan(sejak: string): Promise<DataResult<MerchantOrder[]>> {
  const s = await getSkenario();
  if (s === "gagal-muat" || s === "gagal-sinkron") return GAGAL_MUAT;
  if (s === "kosong" || s === "penjual-baru") return { data: [] };
  const unik = new Map<string, MerchantOrder>();
  let batas = sejak;
  for (let putaran = 0; putaran < 5; putaran++) {
    const res = await merchantFetch<MerchantOrder[]>(`/orders?${new URLSearchParams({ updated_since: batas, limit: "100" })}`);
    if (!res.ok || !res.data) return hasil(res) as { error: ApiError };
    for (const o of res.data) unik.set(o.code, o);
    const terbesar = res.data.reduce((a, o) => (Date.parse(o.updated_at) > Date.parse(a) ? o.updated_at : a), batas);
    if (res.data.length < 100 || Date.parse(terbesar) <= Date.parse(batas)) break;
    batas = terbesar;
  }
  return { data: [...unik.values()] };
}

/** Badge sidebar: pesanan menunggu + terkonfirmasi; galat dianggap 0. */
export async function getJumlahTindakan(): Promise<number> {
  const s = await getSkenario();
  if (s === "gagal-muat" || s === "kosong" || s === "penjual-baru") return 0;
  const res = await merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed&limit=1");
  return (res.ok ? total(res.meta) : 0) + (s === "pesanan-baru" ? 1 : 0);
}

export async function getOrder(code: string): Promise<DataResult<MerchantOrder>> {
  return hasil(await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}`));
}
