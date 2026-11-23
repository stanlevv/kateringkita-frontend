// Route handler GET /api/pesanan/[code]/wa: tombol "Chat WA" penjual pada pesanan. Backend membangun tautan WhatsApp
// dari templat pesan toko (GET /orders/:code/whatsapp), lalu handler ini mengalihkan peramban ke tautan itu.
// Route handler adalah file route.ts yang menjawab permintaan HTTP langsung, bukan menampilkan halaman.
import { redirect } from "next/navigation";
import { merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";

/**
 * Mengalihkan ke tautan WhatsApp pesanan. Hanya tautan https://wa.me/ yang diikuti, supaya handler ini tidak bisa
 * dipakai mengalihkan pengguna ke situs lain (open redirect).
 * @param _request permintaan masuk (tidak dipakai)
 * @param context parameter route; `code` = kode pesanan dari URL
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  // 1. Wajib penjual yang sudah masuk; tanpa sesi dialihkan ke /login?alasan=sesi-habis.
  await requireMerchant();
  const { code } = await params;
  const response = await merchantFetch<{ url: string }>(`/orders/${encodeURIComponent(code)}/whatsapp`);
  const url = response.ok ? response.data?.url : undefined;
  // 2. Tautan sah -> WhatsApp; selain itu kembali ke detail pesanan dengan ?wa=gagal agar penjual melihat pesan galat.
  redirect(
    typeof url === "string" && url.startsWith("https://wa.me/") ? url : `/pesanan/${encodeURIComponent(code)}?wa=gagal`,
  );
}
