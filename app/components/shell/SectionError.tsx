"use client";

// Komponen SectionError: isi error.tsx per bagian (admin, dashboard penjual). Tampil di dalam layout bagian itu,
// jadi sidebar dan header tetap ada saat satu halaman gagal dirender.
import { TriangleAlert } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { LinkButton } from "@/app/components/ui/LinkButton";

/**
 * Pesan "Terjadi kesalahan" di area konten. Sengaja tanpa detail teknis.
 * @param props.retry fungsi `retry` dari Next untuk merender ulang halaman
 * @param props.homeHref beranda bagian ini, mis. "/admin" atau "/dashboard"
 * @param props.homeLabel teks tautan beranda
 * @returns elemen `div` dengan role="alert"
 */
export function SectionError({
  retry,
  homeHref,
  homeLabel,
}: {
  retry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <TriangleAlert aria-hidden className="size-10 text-danger" />
      <h1 className="text-xl font-bold text-ink">Terjadi kesalahan</h1>
      <p className="max-w-sm text-ink-muted">Halaman ini belum bisa ditampilkan. Coba lagi dalam beberapa saat.</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => retry()}>Coba lagi</Button>
        <LinkButton href={homeHref} variant="secondary">
          {homeLabel}
        </LinkButton>
      </div>
    </div>
  );
}
