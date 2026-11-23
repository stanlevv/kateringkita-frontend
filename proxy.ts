import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.get("kk_session")) {
    const loginUrl = new URL("/login", request.url);
    const requestedUrl = new URL(request.nextUrl); // salinan; _rsc hanya parameter internal Next
    requestedUrl.searchParams.delete("_rsc");
    loginUrl.searchParams.set("next", requestedUrl.pathname + requestedUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  // ID yang sama terlihat di DevTools (header response) dan diteruskan ke backend lewat apiFetch
  const requestId = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  // Literal agar dapat dianalisis saat build.
  matcher: [
    "/dashboard/:path*",
    "/menu/:path*",
    "/pesanan/:path*",
    "/laporan/:path*",
    "/promo/:path*",
    "/ulasan/:path*",
    "/pengaturan/:path*",
    "/template-wa/:path*",
    "/copilot/:path*",
    "/pratinjau/:path*",
    "/admin/:path*",
  ],
};
