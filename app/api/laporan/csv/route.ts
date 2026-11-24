// Route handler GET /api/laporan/csv?dari=YYYY-MM-DD&sampai=YYYY-MM-DD: unduhan CSV transaksi penjual untuk halaman
// /laporan. Route handler adalah file route.ts yang menjawab permintaan HTTP langsung, bukan menampilkan halaman.
// Data diambil dari backend lewat getTransactions; sesi dibaca dari cookie sesi lewat getSession.
import { getTransactions } from "@/services/report.service";
import { createTransactionsCsv, validateRange, isCrossSiteRequest } from "@/lib/report";
import { todayWib } from "@/lib/format";
import { getSession } from "@/services/auth.service";

// Jawaban galat JSON `{ message }` yang dibaca halaman laporan untuk ditampilkan ke penjual.
const errorResponse = (status: number, message: string) => Response.json({ message }, { status });

/**
 * Membuat file CSV transaksi untuk rentang tanggal. Unduhan dipanggil lewat fetch, jadi tanpa sesi dijawab 401, bukan
 * dialihkan ke halaman masuk (halaman HTML itu akan ikut terunduh sebagai file).
 * @param request permintaan masuk; parameter `dari` dan `sampai` dibaca dari URL
 * @returns 200 berisi CSV (nama file laporan-<dari>-<sampai>.csv); 401 dari situs lain atau tanpa sesi penjual;
 *   400 rentang tidak sah; 503 server sesi tidak terjangkau; 500 galat backend
 */
export async function GET(request: Request) {
  // 1. Tolak permintaan dari situs lain dengan jawaban yang sama seperti tanpa sesi (tidak membocorkan siapa yang login).
  if (isCrossSiteRequest(request)) return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");
  // 2. Pastikan yang meminta adalah penjual yang sudah masuk.
  let session;
  try {
    session = await getSession();
  } catch {
    return errorResponse(503, "Server tidak dapat dihubungi. Coba lagi sesaat lagi.");
  }
  if (session?.user.role !== "merchant") return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");

  // 3. Baca dan periksa rentang tanggal dari URL.
  const searchParams = new URL(request.url).searchParams;
  const startDate = searchParams.get("dari") ?? "";
  const endDate = searchParams.get("sampai") ?? "";
  const rangeError = validateRange(startDate, endDate, todayWib());
  if (rangeError) return errorResponse(400, rangeError);

  // 4. Ambil transaksi dari backend.
  const result = await getTransactions({ from: startDate, to: endDate });
  if ("error" in result) return errorResponse(500, result.error.message);

  // 5. Kirim sebagai file CSV. BOM (karakter penanda di awal file) agar Excel membaca UTF-8 (nama menu bertanda baca).
  return new Response(`﻿${createTransactionsCsv(result.data)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${startDate}-${endDate}.csv"`,
    },
  });
}
