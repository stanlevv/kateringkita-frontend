"use client";

// Halaman galat panel admin: tampil di dalam layout admin, jadi sidebar tetap bisa dipakai pindah halaman.
import { SectionError } from "@/app/components/shell/SectionError";

/**
 * @param props.retry fungsi dari Next untuk mencoba merender ulang halaman
 * @returns pesan galat dengan tombol Coba lagi dan tautan ke Dashboard admin
 */
export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <SectionError retry={retry} homeHref="/admin" homeLabel="Ke Dashboard admin" />;
}
