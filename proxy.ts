import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (!req.cookies.get("kk_session")) {
    const to = new URL("/login", req.url);
    const dari = new URL(req.nextUrl); // salinan; _rsc hanya parameter internal Next
    dari.searchParams.delete("_rsc");
    to.searchParams.set("next", dari.pathname + dari.search);
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = {
  // Literal agar dapat dianalisis saat build.
  matcher: [
    "/dashboard/:path*", "/menu/:path*", "/pesanan/:path*", "/laporan/:path*", "/promo/:path*", "/ulasan/:path*",
    "/pengaturan/:path*", "/template-wa/:path*", "/copilot/:path*", "/pratinjau/:path*", "/admin/:path*",
  ],
};
