import Link from "next/link";
import { Star } from "lucide-react";
import { cx, focusRing } from "@/app/components/ui/cx";
import { summarizeByMenu, summarizeReviews, reviewsUrl } from "@/lib/review";
import type { Review } from "@/types/review";

const formatDecimal = (value: number) =>
  value.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Bintang sebagai ikon; pembaca layar mendapat teks "4 dari 5 bintang". */
export function StarRating({ value, label }: { value: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cx("size-4", i <= Math.round(value) ? "fill-current text-warning" : "text-line-strong")}
        />
      ))}
      <span className="sr-only">{label ?? `${value} dari 5 bintang`}</span>
    </span>
  );
}

/** UL-N1: rata-rata toko, jumlah ulasan, sebaran 5→1. */
export function RatingSummary({ reviews }: { reviews: Review[] }) {
  const { total, average, distribution } = summarizeReviews(reviews);
  return (
    <section
      aria-label="Ringkasan ulasan"
      className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-8"
    >
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-4xl font-bold text-ink">{formatDecimal(average)}</span>
        <StarRating value={average} label={`${formatDecimal(average)} dari 5 bintang`} />
        <span className="text-ink-muted">dari {total} ulasan</span>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {distribution.map((bucket) => (
          <li key={bucket.stars} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-ink">{bucket.stars} bintang</span>
            <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
              <span
                className="block h-full rounded-full bg-warning"
                style={{ width: `${total ? (bucket.count / total) * 100 : 0}%` }}
              />
            </span>
            <span data-testid="jumlah" className="w-8 shrink-0 text-right font-mono text-sm text-ink">
              {bucket.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** UL-N2: rata-rata per menu; tautan menyaring daftar lewat ?menu=. */
export function MenuRatings({
  reviews,
  menus,
  menuId,
}: {
  reviews: Review[];
  menus: { id: number; name: string }[];
  menuId?: number;
}) {
  const rowClass =
    "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md px-3 py-2 text-ink hover:bg-subtle aria-[current=true]:bg-info-bg aria-[current=true]:font-semibold";
  return (
    <nav aria-label="Ulasan per menu" className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-2">
      <Link href="/ulasan" aria-current={menuId === undefined ? "true" : undefined} className={cx(rowClass, focusRing)}>
        Semua menu
      </Link>
      {summarizeByMenu(reviews, menus).map((menuSummary) => (
        <Link
          key={menuSummary.menu_id}
          href={reviewsUrl({ menu: menuSummary.menu_id })}
          aria-current={menuId === menuSummary.menu_id ? "true" : undefined}
          className={cx(rowClass, focusRing)}
        >
          <span title={menuSummary.menu_name} className="min-w-0 break-words">
            {menuSummary.menu_name}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-sm">
            {menuSummary.count > 0 ? (
              <>
                <StarRating
                  value={menuSummary.average}
                  label={`${formatDecimal(menuSummary.average)} dari 5 bintang`}
                />
                <span className="font-mono">{formatDecimal(menuSummary.average)}</span>
              </>
            ) : null}
            <span className="text-ink-muted">
              {menuSummary.count > 0 ? `${menuSummary.count} ulasan` : "Belum ada ulasan"}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
