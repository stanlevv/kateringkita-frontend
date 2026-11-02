import { getTransactions } from "@/lib/data/reports";
import { buatCsv, cekRentang } from "@/lib/laporan";
import { hariIniWib } from "@/lib/format";
import { getSession } from "@/lib/session";

const galat = (status: number, message: string) => Response.json({ message }, { status });

// LP-N4. Unduhan lewat fetch: tanpa sesi dijawab 401 (bukan redirect ke halaman masuk, yang akan
// terunduh sebagai HTML).
export async function GET(req: Request) {
  let session;
  try {
    session = await getSession();
  } catch {
    return galat(503, "Server tidak dapat dihubungi. Coba lagi sesaat lagi.");
  }
  if (session?.user.role !== "merchant") return galat(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");

  const p = new URL(req.url).searchParams;
  const dari = p.get("dari") ?? "";
  const sampai = p.get("sampai") ?? "";
  const salah = cekRentang(dari, sampai, hariIniWib());
  if (salah) return galat(400, salah);

  const r = await getTransactions({ from: dari, to: sampai });
  if ("error" in r) return galat(500, r.error.message);

  // BOM agar Excel membaca UTF-8 (nama menu bertanda baca).
  return new Response(`﻿${buatCsv(r.data)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${dari}-${sampai}.csv"`,
    },
  });
}
