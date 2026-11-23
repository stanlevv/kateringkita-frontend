// Komponen Pagination: navigasi "Sebelumnya / Halaman X dari Y / Berikutnya" lewat tautan URL. Dipakai di daftar admin dan penjual.
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx, focusRing } from "./cx";

// Gaya tombol halaman (dipakai tautan aktif dan versi nonaktifnya).
const linkClass = cx(
  "inline-flex min-h-11 items-center gap-1 rounded-md border border-line-strong bg-surface px-3 text-ink",
  focusRing,
);

/**
 * Navigasi halaman daftar. Di halaman pertama/terakhir tombolnya berupa teks nonaktif (`aria-disabled`), bukan tautan.
 * @param props.page halaman sekarang (mulai 1)
 * @param props.total jumlah semua baris
 * @param props.limit baris per halaman
 * @param props.hrefFor membuat URL untuk nomor halaman tertentu
 * @returns elemen `nav`
 */
export function Pagination({
  page,
  total,
  limit,
  hrefFor,
}: {
  page: number;
  total: number;
  limit: number;
  hrefFor: (targetPage: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Halaman" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          <ChevronLeft aria-hidden className="size-4" />
          Sebelumnya
        </Link>
      ) : (
        <span aria-disabled="true" className={cx(linkClass, "opacity-50")}>
          <ChevronLeft aria-hidden className="size-4" />
          Sebelumnya
        </span>
      )}
      <span className="text-sm text-ink-muted">
        Halaman {page} dari {pages}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Berikutnya
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={cx(linkClass, "opacity-50")}>
          Berikutnya
          <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}
