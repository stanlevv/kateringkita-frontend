import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { isScenario, SCENARIO_COOKIE } from "@/lib/scenario";

export function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const nilai = req.nextUrl.searchParams.get("nilai");
  const res = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("ke"), "/pratinjau"), req.url));
  if (nilai === "hapus") res.cookies.set(SCENARIO_COOKIE, "", { path: "/", maxAge: 0 });
  else if (isScenario(nilai)) res.cookies.set(SCENARIO_COOKIE, nilai, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
