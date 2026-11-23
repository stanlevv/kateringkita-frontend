// Format angka dan waktu untuk tampilan: rupiah, jam, tanggal, waktu relatif, nomor telepon.
// Semua waktu ditampilkan dalam WIB (Asia/Jakarta), apa pun zona waktu perangkat atau server.

const TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 3600e3;

/**
 * Membuat Date yang bila dibaca dengan getUTC*() menghasilkan jam dinding WIB (waktu digeser +7 jam).
 * @param timestamp waktu dalam milidetik
 */
export const toWibClock = (timestamp: number) => new Date(timestamp + WIB_OFFSET_MS);

/**
 * Mengambil tanggal WIB ("2026-10-31") dari waktu ISO.
 * @param iso waktu ISO-8601
 */
export const wibDate = (iso: string) => toWibClock(Date.parse(iso)).toISOString().slice(0, 10);

/** Tanggal hari ini dalam WIB, format YYYY-MM-DD. */
export const todayWib = () => toWibClock(Date.now()).toISOString().slice(0, 10);

/**
 * Jam (0–23, WIB) dari waktu ISO.
 * @param iso waktu ISO-8601
 */
export const wibHour = (iso: string) => toWibClock(Date.parse(iso)).getUTCHours();

/**
 * Menulis angka sebagai rupiah, mis. "Rp 25.000" (dibulatkan ke rupiah terdekat).
 * @param amount jumlah rupiah
 */
export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

/**
 * Menulis jam WIB, mis. "11.42".
 * @param iso waktu ISO-8601
 */
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

/**
 * Menulis tanggal WIB, mis. "31 Okt 2026".
 * @param iso waktu ISO-8601
 */
export function formatDate(iso: string): string {
  const clock = toWibClock(Date.parse(iso));
  return `${clock.getUTCDate()} ${MONTH_NAMES[clock.getUTCMonth()]} ${clock.getUTCFullYear()}`;
}

/**
 * Menulis waktu relatif: "Baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu"; 7 hari atau lebih jadi tanggal biasa.
 * `now` dikirim pemanggil (mis. waktu render di server) supaya hasil di server dan di browser sama
 * (kalau berbeda, React memberi peringatan hydration mismatch).
 * @param iso waktu ISO-8601
 * @param now waktu acuan dalam milidetik
 */
export function formatRelativeTime(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} jam lalu`;
  if (minutes < 7 * 24 * 60) return `${Math.floor(minutes / (24 * 60))} hari lalu`;
  return formatDate(iso);
}

/**
 * Menulis nomor telepon menjadi "0812-3456-7890". Awalan 62 diubah jadi 0; nomor yang terlalu pendek dikembalikan apa adanya.
 * @param raw nomor mentah
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^62/, "0");
  if (digits.length < 10) return raw;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}

/**
 * Mengubah waktu ISO (UTC) menjadi isian input datetime-local dalam WIB, mis. "2026-10-31T09:00".
 * @param iso waktu ISO-8601
 */
export function isoToWibInput(iso: string): string {
  return toWibClock(Date.parse(iso)).toISOString().slice(0, 16);
}

/**
 * Mengubah isian input datetime-local (WIB) menjadi waktu ISO UTC.
 * @param input isian seperti "2026-10-31T09:00"
 * @returns waktu ISO, atau "" bila formatnya tidak valid
 */
export function wibInputToIso(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return "";
  const timestamp = Date.parse(`${input}:00Z`);
  return Number.isNaN(timestamp) ? "" : new Date(timestamp - WIB_OFFSET_MS).toISOString();
}
