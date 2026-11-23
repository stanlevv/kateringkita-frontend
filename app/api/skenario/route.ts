import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { isScenario, SCENARIO_COOKIE } from "@/lib/scenario";

export function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const scenarioValue = request.nextUrl.searchParams.get("nilai");
  const response = NextResponse.redirect(
    new URL(safeNext(request.nextUrl.searchParams.get("ke"), "/pratinjau"), request.url),
  );
  if (scenarioValue === "hapus") response.cookies.set(SCENARIO_COOKIE, "", { path: "/", maxAge: 0 });
  else if (isScenario(scenarioValue))
    response.cookies.set(SCENARIO_COOKIE, scenarioValue, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
