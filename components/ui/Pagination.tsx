import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx, fokus } from "./cx";

const sel = cx("inline-flex min-h-11 items-center gap-1 rounded-md border border-line-strong bg-surface px-3 text-ink", fokus);

export function Pagination({ page, total, limit, hrefFor }: { page: number; total: number; limit: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Halaman" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={sel}><ChevronLeft aria-hidden className="size-4" />Sebelumnya</Link>
      ) : (
        <span aria-disabled="true" className={cx(sel, "opacity-50")}><ChevronLeft aria-hidden className="size-4" />Sebelumnya</span>
      )}
      <span className="text-sm text-ink-muted">Halaman {page} dari {pages}</span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={sel}>Berikutnya<ChevronRight aria-hidden className="size-4" /></Link>
      ) : (
        <span aria-disabled="true" className={cx(sel, "opacity-50")}>Berikutnya<ChevronRight aria-hidden className="size-4" /></span>
      )}
    </nav>
  );
}
