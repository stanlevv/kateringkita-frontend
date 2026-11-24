// Aturan dan label bersama halaman admin "Chat dilaporkan". Tidak memanggil backend.

/** Jumlah laporan per halaman. */
export const LIMIT_CHAT_REPORTS = 20;

/** Label pihak pelapor. */
export const REPORTER_LABELS = { customer: "Pembeli", merchant: "Penjual" } as const;
/** Pengganti nama pelapor bila akunnya sudah dihapus (backend mengirim `reporter_name: null`). */
export const DELETED_REPORTER_NAME = "(akun dihapus)";

/**
 * Memeriksa id laporan di URL: bilangan bulat positif, tanpa huruf atau tanda lain.
 * Backend tetap penentu laporan itu ada atau tidak.
 * @param id nilai dari URL
 * @returns true bila id berupa angka bulat positif
 */
export const isValidChatReportId = (id: unknown): id is string => typeof id === "string" && /^[1-9]\d{0,9}$/.test(id);

/**
 * Membaca nomor halaman dari URL; selain bilangan bulat 1–100.000 dianggap halaman 1.
 * @param value nilai mentah dari searchParams
 * @returns nomor halaman yang sah
 */
export function parseReportPage(value: unknown): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1;
}
