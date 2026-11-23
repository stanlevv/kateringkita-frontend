// LG-N1: hanya path internal; tolak URL absolut, "//", backslash, dan karakter kontrol (termasuk DEL).
// Browser membuang karakter kontrol & membaca backslash sebagai "/", sehingga "/\t/evil.com" menjadi "//evil.com".
export function safeNext(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  // AUD-30: kembalikan path hasil normalisasi, bukan string mentah: "/..//evil.com" dinormalisasi menjadi "//evil.com"
  const u = new URL(raw, "http://x.invalid");
  const path = u.pathname + u.search + u.hash;
  return u.origin === "http://x.invalid" && !path.startsWith("//") ? path : fallback;
}
