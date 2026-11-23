// Waktu data contoh dihitung saat dipanggil, agar timer & filter "hari ini" tetap berarti.
export const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
export const minutesFromNow = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();
export const daysAgo = (days: number): string => minutesAgo(days * 1440);
export const daysFromNow = (days: number): string => minutesFromNow(days * 1440);
