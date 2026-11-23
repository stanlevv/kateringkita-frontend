// Data tamu pesan dari meja yang disimpan di browser (localStorage): token tamu, keranjang, meja terakhir, dan nama.
// Komponen membacanya lewat useSyncExternalStore (hook React untuk data di luar React); nilainya teks mentah agar stabil.
// Nama kunci (kk-tamu:…, dll.) dan bentuk datanya jangan diubah, nanti data tamu yang sudah tersimpan hilang.

import type { SavedCartLine } from "./table-cart";

// Cadangan di memori: localStorage bisa melempar galat (mode privat atau diblokir), keranjang tetap jalan selama halaman terbuka.
const memoryStore = new Map<string, string>();
const readItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
};
const writeItem = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    if (value === null) memoryStore.delete(key);
    else memoryStore.set(key, value);
  }
};
const parseJson = <T>(value: string | null, fallback: T): T => {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const CHANGE_EVENT = "kk-meja-simpan";
/**
 * Mendaftarkan fungsi yang dipanggil saat data berubah, di tab ini maupun di tab lain.
 * @param onChange fungsi yang dipanggil saat ada perubahan
 * @returns fungsi untuk berhenti mendengarkan
 */
export function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const notifyChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

/**
 * Data tamu satu pesanan: token tamu dan token meja. Token tamu adalah satu-satunya kunci untuk melihat dan membayar pesanan ini.
 */
export type GuestData = { tamu: string; meja: string };
/** Membaca data tamu (teks mentah) untuk satu kode pesanan. */
export const readGuestRaw = (code: string) => readItem(`kk-tamu:${code}`);
/** Mengubah teks mentah data tamu menjadi objek; null bila kosong atau rusak. */
export const parseGuest = (raw: string | null) => parseJson<GuestData | null>(raw, null);
/** Menyimpan data tamu untuk satu kode pesanan. */
export const saveGuest = (code: string, guest: GuestData) => writeItem(`kk-tamu:${code}`, JSON.stringify(guest));

/**
 * Membaca keranjang (teks mentah) untuk satu meja.
 * @param table token meja
 */
export const readCartRaw = (table: string) => readItem(`kk-keranjang:${table}`);
/** Mengubah teks mentah keranjang menjadi daftar baris; daftar kosong bila kosong atau rusak. */
export const parseCart = (raw: string | null) => parseJson<SavedCartLine[]>(raw, []);
/**
 * Menyimpan keranjang satu meja (keranjang kosong berarti dihapus), lalu memberi tahu komponen yang mendengarkan.
 * @param table token meja
 * @param items baris keranjang
 */
export function saveCart(table: string, items: SavedCartLine[]) {
  writeItem(`kk-keranjang:${table}`, items.length ? JSON.stringify(items) : null);
  notifyChange();
}

/** Membaca token meja yang terakhir dibuka. */
export const readLastTable = () => parseJson<string | null>(readItem("kk-meja-terakhir"), null);
/** Menyimpan token meja yang terakhir dibuka. */
export const saveLastTable = (table: string) => writeItem("kk-meja-terakhir", JSON.stringify(table));

/** Membaca nama tamu yang pernah diisi; "" bila belum ada. */
export const readGuestName = () => parseJson<string>(readItem("kk-nama-tamu"), "");
/** Menyimpan nama tamu agar tidak perlu mengetik ulang. */
export const saveGuestName = (name: string) => writeItem("kk-nama-tamu", JSON.stringify(name));
