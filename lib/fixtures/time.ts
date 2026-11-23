// Pembuat waktu untuk data contoh. Dihitung saat dipanggil, agar hitung mundur dan penyaring "hari ini" tetap berlaku.

/** Waktu ISO sekian menit yang lalu. */
export const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
/** Waktu ISO sekian menit dari sekarang. */
export const minutesFromNow = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();
/** Waktu ISO sekian hari yang lalu. */
export const daysAgo = (days: number): string => minutesAgo(days * 1440);
/** Waktu ISO sekian hari dari sekarang. */
export const daysFromNow = (days: number): string => minutesFromNow(days * 1440);
