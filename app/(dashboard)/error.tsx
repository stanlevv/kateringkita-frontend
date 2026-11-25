"use client";

// Halaman galat dashboard penjual: tampil di dalam layout penjual, jadi sidebar tetap bisa dipakai pindah halaman.
import { SectionError } from "@/app/components/shell/SectionError";

/**
 * @param props.retry fungsi dari Next untuk mencoba merender ulang halaman
 * @returns pesan galat dengan tombol Coba lagi dan tautan ke Dashboard
 */
export default function DashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <SectionError retry={retry} homeHref="/dashboard" homeLabel="Ke Dashboard" />;
}
