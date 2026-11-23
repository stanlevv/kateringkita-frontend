import type { SavedCartLine } from "./table-cart";

// F21: data tamu di peramban, dibaca komponen lewat useSyncExternalStore (snapshot = string mentah agar stabil).
// localStorage bisa melempar (mode privat/diblokir) → cadangan di memori agar keranjang tetap jalan selama halaman terbuka.
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
/** Langganan useSyncExternalStore: perubahan di tab ini (kejadian sendiri) dan tab lain (storage). */
export function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const notifyChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export type GuestData = { tamu: string; meja: string };
// token tamu = satu-satunya kunci untuk melihat & membayar pesanan ini
export const readGuestRaw = (code: string) => readItem(`kk-tamu:${code}`);
export const parseGuest = (raw: string | null) => parseJson<GuestData | null>(raw, null);
export const saveGuest = (code: string, guest: GuestData) => writeItem(`kk-tamu:${code}`, JSON.stringify(guest));

export const readCartRaw = (table: string) => readItem(`kk-keranjang:${table}`);
export const parseCart = (raw: string | null) => parseJson<SavedCartLine[]>(raw, []);
export function saveCart(table: string, items: SavedCartLine[]) {
  writeItem(`kk-keranjang:${table}`, items.length ? JSON.stringify(items) : null);
  notifyChange();
}

export const readLastTable = () => parseJson<string | null>(readItem("kk-meja-terakhir"), null);
export const saveLastTable = (table: string) => writeItem("kk-meja-terakhir", JSON.stringify(table));

export const readGuestName = () => parseJson<string>(readItem("kk-nama-tamu"), "");
export const saveGuestName = (name: string) => writeItem("kk-nama-tamu", JSON.stringify(name));
