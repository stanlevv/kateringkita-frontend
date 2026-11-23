// Pembuat waktu untuk data contoh. Dihitung saat dipanggil, agar hitung mundur dan penyaring "hari ini" tetap berlaku.

/**
 * Waktu ISO sekian menit yang lalu.
 * @param minutes jumlah menit mundur
 * @returns waktu ISO
 */
export const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
/**
 * Waktu ISO sekian menit dari sekarang.
 * @param minutes jumlah menit maju
 * @returns waktu ISO
 */
export const minutesFromNow = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();
/**
 * Waktu ISO sekian hari yang lalu.
 * @param days jumlah hari mundur
 * @returns waktu ISO
 */
export const daysAgo = (days: number): string => minutesAgo(days * 1440);
/**
 * Waktu ISO sekian hari dari sekarang.
 * @param days jumlah hari maju
 * @returns waktu ISO
 */
export const daysFromNow = (days: number): string => minutesFromNow(days * 1440);
