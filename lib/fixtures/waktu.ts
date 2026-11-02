// Waktu data contoh dihitung saat dipanggil, agar timer & filter "hari ini" tetap berarti.
export const menitLalu = (n: number): string => new Date(Date.now() - n * 60_000).toISOString();
export const menitLagi = (n: number): string => new Date(Date.now() + n * 60_000).toISOString();
export const hariLalu = (n: number): string => menitLalu(n * 1440);
export const hariLagi = (n: number): string => menitLagi(n * 1440);
