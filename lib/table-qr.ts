// Pembaca isi QR meja. Isi QR = `${origin}/meja/${token}` (dibuat di app/components/table/TableQr.tsx).
// Hanya token yang diambil; tujuan selalu /meja/<token> di web ini sendiri,
// jadi QR dari domain lain tidak bisa membelokkan pembeli ke situs luar.

const TABLE_PATH = /^\/meja\/([A-Za-z0-9_-]{16,64})\/?$/;

/**
 * Mengambil token meja dari teks hasil pindai QR.
 * @param text teks dari QR
 * @returns token, atau null bila bukan QR meja KateringKita
 */
export function tableTokenFromQr(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return TABLE_PATH.exec(url.pathname)?.[1] ?? null;
}
