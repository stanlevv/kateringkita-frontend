// LG-N1: hanya path internal; tolak URL absolut, "//", backslash, dan karakter kontrol (termasuk DEL).
// Browser membuang karakter kontrol & membaca backslash sebagai "/", sehingga "/\t/evil.com" menjadi "//evil.com".
export function safeNext(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return new URL(raw, "http://x.invalid").origin === "http://x.invalid" ? raw : fallback;
}
