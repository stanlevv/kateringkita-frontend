// Proxy (dulu disebut middleware di Next): kode yang dijalankan Next sebelum halaman di `config.matcher` dibuka.
// Tugasnya: (1) pengunjung tanpa cookie sesi kk_session dialihkan ke /login?next=<halaman asal>, supaya setelah masuk
// kembali ke halaman itu; (2) permintaan yang lolos cek cookie diberi header x-request-id (di request ke halaman dan di
// response) untuk menelusuri log di backend. Pengalihan ke /login tidak diberi x-request-id.
// Proxy hanya memeriksa ada tidaknya cookie; keabsahan sesi dan peran (penjual/admin) diperiksa layout dan services.
// Nama file, ekspor `proxy`/`config`, dan isi matcher dibaca Next, jadi tidak boleh diganti.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Penjaga halaman dashboard dan admin.
 * @param request permintaan masuk
 * @returns pengalihan ke /login (tanpa cookie sesi), atau lanjut ke halaman dengan header x-request-id
 */
export function proxy(request: NextRequest) {
  // 1. Tanpa cookie sesi -> ke /login dengan `next` berisi path dan query asal.
  if (!request.cookies.get("kk_session")) {
    const loginUrl = new URL("/login", request.url);
    const requestedUrl = new URL(request.nextUrl); // salinan; _rsc hanya parameter internal Next
    requestedUrl.searchParams.delete("_rsc");
    loginUrl.searchParams.set("next", requestedUrl.pathname + requestedUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  // 2. ID yang sama terlihat di DevTools (header response) dan diteruskan ke backend lewat apiFetch
  const requestId = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

// Halaman yang dijaga proxy. /meja, /login, /register, /lupa-sandi, dan /api tidak termasuk: route handler di /api
// menjaga dirinya sendiri.
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
