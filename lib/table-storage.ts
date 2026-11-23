import type { BarisTersimpan } from "./meja-keranjang";

// F21: data tamu di peramban, dibaca komponen lewat useSyncExternalStore (snapshot = string mentah agar stabil).
// localStorage bisa melempar (mode privat/diblokir) → cadangan di memori agar keranjang tetap jalan selama halaman terbuka.
const memori = new Map<string, string>();
const ambil = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return memori.get(k) ?? null;
  }
};
const taruh = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    if (v === null) memori.delete(k);
    else memori.set(k, v);
  }
};
const urai = <T>(v: string | null, cadangan: T): T => {
  if (v === null) return cadangan;
  try {
    return JSON.parse(v) as T;
  } catch {
    return cadangan;
  }
};

const KEJADIAN = "kk-meja-simpan";
/** Langganan useSyncExternalStore: perubahan di tab ini (kejadian sendiri) dan tab lain (storage). */
export function langganan(ubah: () => void) {
  window.addEventListener(KEJADIAN, ubah);
  window.addEventListener("storage", ubah);
  return () => {
    window.removeEventListener(KEJADIAN, ubah);
    window.removeEventListener("storage", ubah);
  };
}
const kabari = () => window.dispatchEvent(new Event(KEJADIAN));

export type DataTamu = { tamu: string; meja: string };
// token tamu = satu-satunya kunci untuk melihat & membayar pesanan ini
export const tamuMentah = (code: string) => ambil(`kk-tamu:${code}`);
export const uraiTamu = (mentah: string | null) => urai<DataTamu | null>(mentah, null);
export const simpanTamu = (code: string, d: DataTamu) => taruh(`kk-tamu:${code}`, JSON.stringify(d));

export const keranjangMentah = (meja: string) => ambil(`kk-keranjang:${meja}`);
export const uraiKeranjang = (mentah: string | null) => urai<BarisTersimpan[]>(mentah, []);
export function simpanKeranjang(meja: string, items: BarisTersimpan[]) {
  taruh(`kk-keranjang:${meja}`, items.length ? JSON.stringify(items) : null);
  kabari();
}

export const mejaTerakhir = () => urai<string | null>(ambil("kk-meja-terakhir"), null);
export const simpanMejaTerakhir = (meja: string) => taruh("kk-meja-terakhir", JSON.stringify(meja));

export const bacaNama = () => urai<string>(ambil("kk-nama-tamu"), "");
export const simpanNama = (nama: string) => taruh("kk-nama-tamu", JSON.stringify(nama));
