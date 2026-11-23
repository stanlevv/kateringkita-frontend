import { getFinanceSummary } from "@/services/admin-finance.service";
import { validateRange, isCrossSiteRequest } from "@/lib/report";
import { createFinanceCsv } from "@/lib/finance";
import { todayWib } from "@/lib/format";
import { getSession } from "@/services/auth.service";

const galat = (status: number, message: string) => Response.json({ message }, { status });

// F20: unduhan CSV rekap keuangan; pola sama dengan /api/laporan/csv (tanpa sesi admin = 401, bukan redirect)
export async function GET(req: Request) {
  if (isCrossSiteRequest(req)) return galat(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");
  let session;
  try {
    session = await getSession();
  } catch {
    return galat(503, "Server tidak dapat dihubungi. Coba lagi sesaat lagi.");
  }
  if (session?.user.role !== "admin") return galat(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");

  const p = new URL(req.url).searchParams;
  const dari = p.get("dari") ?? "";
  const sampai = p.get("sampai") ?? "";
  const salah = validateRange(dari, sampai, todayWib());
  if (salah) return galat(400, salah);

  const r = await getFinanceSummary({ from: dari, to: sampai });
  if ("error" in r) return galat(500, r.error.message);

  return new Response(`﻿${createFinanceCsv(r.data)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keuangan-${dari}-${sampai}.csv"`,
    },
  });
}
