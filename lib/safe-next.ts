// Pengaman alamat tujuan setelah login (parameter `?next=`), agar tautan login tidak bisa membelokkan pengguna ke situs lain.

/**
 * Mengembalikan alamat tujuan hanya bila berupa path di web ini sendiri.
 * URL absolut, "//", backslash, dan karakter kontrol ditolak, karena browser membuang karakter kontrol dan membaca
 * backslash sebagai "/", sehingga "/\t/evil.com" bisa menjadi "//evil.com" (situs lain).
 * @param raw nilai `next` dari URL
 * @param fallback tujuan bila nilai ditolak
 * @returns path yang aman
 */
export function safeNext(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  // Kembalikan path hasil normalisasi, bukan teks mentah: "/..//evil.com" dinormalisasi menjadi "//evil.com" (situs lain)
  const url = new URL(raw, "http://x.invalid");
  const path = url.pathname + url.search + url.hash;
  return url.origin === "http://x.invalid" && !path.startsWith("//") ? path : fallback;
}
