// Route handler GET /api/skenario?nilai=<skenario>&ke=<path>: alat uji tampilan untuk halaman /pratinjau, hanya di mode
// pengembangan. Memasang cookie kk_skenario (mis. "gagal-muat", "kosong") yang dibaca services untuk memalsukan
// hasil backend, lalu mengalihkan ke `ke`. `nilai=hapus` menghapus cookie itu.
// Route handler adalah file route.ts yang menjawab permintaan HTTP langsung, bukan menampilkan halaman.
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { isScenario, SCENARIO_COOKIE } from "@/lib/scenario";

/**
 * Memasang atau menghapus cookie skenario, lalu mengalihkan.
 * @param request permintaan masuk; parameter `nilai` dan `ke` dibaca dari URL
 * @returns 404 di produksi; selain itu pengalihan ke `ke` (hanya path di situs ini, bawaan /pratinjau)
 */
export function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  // safeNext menolak tujuan ke situs lain (mencegah open redirect) dan memakai /pratinjau sebagai gantinya.
  const scenarioValue = request.nextUrl.searchParams.get("nilai");
  const response = NextResponse.redirect(
    new URL(safeNext(request.nextUrl.searchParams.get("ke"), "/pratinjau"), request.url),
  );
  if (scenarioValue === "hapus") response.cookies.set(SCENARIO_COOKIE, "", { path: "/", maxAge: 0 });
  else if (isScenario(scenarioValue))
    response.cookies.set(SCENARIO_COOKIE, scenarioValue, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
