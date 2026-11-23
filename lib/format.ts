const TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 3600e3;

/** Date yang getUTC*()-nya membaca jam dinding WIB. */
export const toWibClock = (timestamp: number) => new Date(timestamp + WIB_OFFSET_MS);

/** "2026-10-31" dalam WIB. */
export const wibDate = (iso: string) => toWibClock(Date.parse(iso)).toISOString().slice(0, 10);

/** Tanggal hari ini (YYYY-MM-DD) dalam WIB. */
export const todayWib = () => toWibClock(Date.now()).toISOString().slice(0, 10);

/** Jam (0-23, WIB) dari waktu ISO. */
export const wibHour = (iso: string) => toWibClock(Date.parse(iso)).getUTCHours();

export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

/** "11.42" dalam WIB. */
export function formatTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${getPart("hour")}.${getPart("minute")}`;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "31 Okt 2026" dalam WIB. */
export function formatDate(iso: string): string {
  const clock = toWibClock(Date.parse(iso));
  return `${clock.getUTCDate()} ${MONTH_NAMES[clock.getUTCMonth()]} ${clock.getUTCFullYear()}`;
}

/**
 * "Baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu"; 7 hari atau lebih -> "31 Okt 2026".
 * `sekarang` dikirim pemanggil (mis. waktu render server) supaya hasil server dan hidrasi klien sama.
 */
export function formatRelativeTime(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} jam lalu`;
  if (minutes < 7 * 24 * 60) return `${Math.floor(minutes / (24 * 60))} hari lalu`;
  return formatDate(iso);
}

/** "0812-3456-7890"; nomor yang terlalu pendek dikembalikan apa adanya. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^62/, "0");
  if (digits.length < 10) return raw;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}

/** ISO UTC -> "2026-10-31T09:00" (WIB) untuk input datetime-local. */
export function isoToWibInput(iso: string): string {
  return toWibClock(Date.parse(iso)).toISOString().slice(0, 16);
}

/** "2026-10-31T09:00" (WIB) -> ISO UTC; "" bila tidak valid. */
export function wibInputToIso(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return "";
  const timestamp = Date.parse(`${input}:00Z`);
  return Number.isNaN(timestamp) ? "" : new Date(timestamp - WIB_OFFSET_MS).toISOString();
}
