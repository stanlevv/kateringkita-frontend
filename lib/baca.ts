import "server-only";
import { getSkenario, type Skenario } from "@/lib/skenario";
import type { DataResult } from "@/types/api";

/** Bungkus pembacaan data contoh: skenario gagal-muat -> error API.md, selain itu { data }. */
export async function baca<T>(buat: (s: Skenario | null) => T): Promise<DataResult<T>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  return { data: buat(s) };
}

/** Skenario yang membuat daftar dan angka kosong. */
export const kosongkan = (s: Skenario | null) => s === "kosong" || s === "penjual-baru";
