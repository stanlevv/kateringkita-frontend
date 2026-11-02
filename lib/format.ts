const ZONA = "Asia/Jakarta";
const WIB_MS = 7 * 3600e3;

/** Date yang getUTC*()-nya membaca jam dinding WIB. */
export const geserWib = (ms: number) => new Date(ms + WIB_MS);

/** "2026-10-31" dalam WIB. */
export const tanggalWib = (iso: string) => geserWib(Date.parse(iso)).toISOString().slice(0, 10);

/** Tanggal hari ini (YYYY-MM-DD) dalam WIB. */
export const hariIniWib = () => geserWib(Date.now()).toISOString().slice(0, 10);

/** Jam (0-23, WIB) dari waktu ISO. */
export const jamWib = (iso: string) => geserWib(Date.parse(iso)).getUTCHours();

export function formatRupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

/** "11.42" dalam WIB. */
export function formatJam(iso: string): string {
  const p = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("hour")}.${g("minute")}`;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "31 Okt 2026" dalam WIB. */
export function formatTanggal(iso: string): string {
  const w = geserWib(Date.parse(iso));
  return `${w.getUTCDate()} ${BULAN[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}

/** "0812-3456-7890"; nomor yang terlalu pendek dikembalikan apa adanya. */
export function formatTelepon(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^62/, "0");
  if (d.length < 10) return raw;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

/** ISO UTC -> "2026-10-31T09:00" (WIB) untuk input datetime-local. */
export function isoKeInputWib(iso: string): string {
  return geserWib(Date.parse(iso)).toISOString().slice(0, 16);
}

/** "2026-10-31T09:00" (WIB) -> ISO UTC; "" bila tidak valid. */
export function inputWibKeIso(v: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return "";
  const t = Date.parse(`${v}:00Z`);
  return Number.isNaN(t) ? "" : new Date(t - WIB_MS).toISOString();
}
