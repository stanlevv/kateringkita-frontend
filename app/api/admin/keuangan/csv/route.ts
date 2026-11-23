import { getFinanceSummary } from "@/services/admin-finance.service";
import { validateRange, isCrossSiteRequest } from "@/lib/report";
import { createFinanceCsv } from "@/lib/finance";
import { todayWib } from "@/lib/format";
import { getSession } from "@/services/auth.service";

const errorResponse = (status: number, message: string) => Response.json({ message }, { status });

// F20: unduhan CSV rekap keuangan; pola sama dengan /api/laporan/csv (tanpa sesi admin = 401, bukan redirect)
export async function GET(request: Request) {
  if (isCrossSiteRequest(request)) return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");
  let session;
  try {
    session = await getSession();
  } catch {
    return errorResponse(503, "Server tidak dapat dihubungi. Coba lagi sesaat lagi.");
  }
  if (session?.user.role !== "admin") return errorResponse(401, "Sesi berakhir. Masuk lagi untuk mengunduh.");

  const searchParams = new URL(request.url).searchParams;
  const startDate = searchParams.get("dari") ?? "";
  const endDate = searchParams.get("sampai") ?? "";
  const rangeError = validateRange(startDate, endDate, todayWib());
  if (rangeError) return errorResponse(400, rangeError);

  const result = await getFinanceSummary({ from: startDate, to: endDate });
  if ("error" in result) return errorResponse(500, result.error.message);

  return new Response(`﻿${createFinanceCsv(result.data)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keuangan-${startDate}-${endDate}.csv"`,
    },
  });
}
