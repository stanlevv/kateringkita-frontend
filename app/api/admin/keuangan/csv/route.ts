// Route handler GET /api/admin/keuangan/csv?dari=YYYY-MM-DD&sampai=YYYY-MM-DD: unduhan CSV rekap keuangan per toko
// untuk halaman admin keuangan. Polanya sama dengan /api/laporan/csv, tetapi hanya untuk admin. Data diambil dari
// backend lewat getFinanceSummary; sesi dibaca dari cookie sesi lewat getSession.
// Route handler adalah file route.ts yang menjawab permintaan HTTP langsung, bukan menampilkan halaman.
import { getFinanceSummary } from "@/services/admin-finance.service";
import { validateRange, isCrossSiteRequest } from "@/lib/report";
import { createFinanceCsv } from "@/lib/finance";
import { todayWib } from "@/lib/format";
import { getSession } from "@/services/auth.service";

// Jawaban galat JSON `{ message }` yang dibaca halaman admin untuk ditampilkan.
const errorResponse = (status: number, message: string) => Response.json({ message }, { status });

/**
 * Membuat file CSV rekap keuangan (baris per toko dan baris TOTAL) untuk rentang tanggal. Tanpa sesi admin dijawab
 * 401, bukan dialihkan, karena unduhan dipanggil lewat fetch.
 * @param request permintaan masuk; parameter `dari` dan `sampai` dibaca dari URL
 * @returns 200 berisi CSV (nama file keuangan-<dari>-<sampai>.csv); 401 dari situs lain atau bukan admin;
 *   400 rentang tidak sah; 503 server sesi tidak terjangkau; 500 galat backend
 */
export async function GET(request: Request) {
  // 1. Tolak permintaan dari situs lain dengan jawaban yang sama seperti tanpa sesi.
  if (isCrossSiteRequest(request)) return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");
  // 2. Pastikan yang meminta adalah admin yang sudah masuk.
  let session;
  try {
    session = await getSession();
  } catch {
    return errorResponse(503, "Server tidak dapat dihubungi. Coba lagi sesaat lagi.");
  }
  if (session?.user.role !== "admin") return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");

  // 3. Baca dan periksa rentang tanggal dari URL.
  const searchParams = new URL(request.url).searchParams;
  const startDate = searchParams.get("dari") ?? "";
  const endDate = searchParams.get("sampai") ?? "";
  const rangeError = validateRange(startDate, endDate, todayWib());
  if (rangeError) return errorResponse(400, rangeError);

  // 4. Ambil rekap dari backend.
  const result = await getFinanceSummary({ from: startDate, to: endDate });
  if ("error" in result) return errorResponse(500, result.error.message);

  // 5. Kirim sebagai file CSV; BOM di awal agar Excel membaca UTF-8.
  return new Response(`﻿${createFinanceCsv(result.data)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keuangan-${startDate}-${endDate}.csv"`,
    },
  });
}
