"use server";

// Server action pesan dari meja: penjual mengatur fitur makan di tempat dan daftar meja; tamu (tanpa login) memesan lewat QR meja.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend. Validasi isi ada di backend; file ini hanya meneruskan.

import { apiFetch, toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Table, TableOrder } from "@/types/table";
import type { MerchantProfile } from "@/types/profile";

// ---- penjual ----

/**
 * Menyalakan atau mematikan fitur pesan dari meja untuk toko (PATCH /merchant/profile, field `dine_in_enabled`).
 * @param enabled true = fitur aktif
 * @returns `{ data }` berisi profil toko terbaru, atau `{ error }` dari backend
 */
export async function setDineIn(enabled: boolean): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify({ dine_in_enabled: enabled }),
    }),
  );
}

/**
 * Menambah meja baru (POST /merchant/tables); token QR meja dibuat backend.
 * @param label nama meja, mis. "Meja 1"
 * @returns `{ data }` berisi meja baru (termasuk `token` QR), atau `{ error }` dari backend
 */
export async function createTable(label: string): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>("/tables", { method: "POST", body: JSON.stringify({ label }) }));
}

/**
 * Mengubah meja (PATCH /merchant/tables/:id): ganti label, aktif/nonaktif, atau buat token QR baru (`ganti_token: true`).
 * @param id id meja
 * @param input field yang diubah saja
 * @returns `{ data }` berisi meja terbaru, atau `{ error }` dari backend
 */
export async function updateTable(
  id: number,
  input: { label?: string; is_active?: boolean; ganti_token?: true },
): Promise<ActionResult<Table>> {
  await requireMerchant();
  return toResult(await merchantFetch<Table>(`/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

// ---- tamu (tanpa login) ----

// Tamu dikenali dari token tamu yang didapat saat memesan, dikirim lewat header ini.
const guestHeaders = (token: string) => ({ "X-Guest-Token": token });

/**
 * Membuat pesanan dari meja (POST /tables/:token/orders). Tidak butuh login.
 * @param token token QR meja (dari URL /meja/:token)
 * @param input isi pesanan (item, nama dan nomor tamu, catatan) apa adanya; backend yang memvalidasi
 * @returns `{ data }` berisi pesanan dan `guest_token` untuk mengecek status nanti, atau `{ error }` dari backend
 */
export async function createTableOrder(
  token: string,
  input: unknown,
): Promise<ActionResult<TableOrder & { guest_token: string }>> {
  return toResult(
    await apiFetch(`/tables/${encodeURIComponent(token)}/orders`, { method: "POST", body: JSON.stringify(input) }),
  );
}

/**
 * Mengambil status pesanan tamu (GET /guest/orders/:code).
 * @param code kode pesanan
 * @param token token tamu dari `createTableOrder`
 * @returns `{ data }` berisi pesanan, atau `{ error }` dari backend
 */
export async function getTableOrderStatus(code: string, token: string): Promise<ActionResult<TableOrder>> {
  return toResult(await apiFetch(`/guest/orders/${encodeURIComponent(code)}`, { headers: guestHeaders(token) }));
}

/**
 * Meminta tautan pembayaran Midtrans (layanan pembayaran online) untuk pesanan tamu (POST /guest/orders/:code/pay).
 * @param code kode pesanan
 * @param token token tamu dari `createTableOrder`
 * @param returnUrl alamat halaman status pesanan tempat tamu kembali setelah membayar (dikirim sebagai field `kembali`)
 * @returns `{ data: { payment_url } }`, atau `{ error }` dari backend
 */
export async function payTableOrder(
  code: string,
  token: string,
  returnUrl: string,
): Promise<ActionResult<{ payment_url: string }>> {
  return toResult(
    await apiFetch(`/guest/orders/${encodeURIComponent(code)}/pay`, {
      method: "POST",
      headers: guestHeaders(token),
      body: JSON.stringify({ kembali: returnUrl }),
    }),
  );
}
