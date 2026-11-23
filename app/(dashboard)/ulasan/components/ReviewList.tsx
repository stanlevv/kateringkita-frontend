// Komponen ReviewList: tautan filter bintang, daftar ulasan (nama pembeli disamarkan), dan paginasi lewat URL di
// /ulasan. Data sudah disaring dan dipotong per halaman oleh page.tsx. Server component (tanpa state).
import Link from "next/link";
import { MessageSquareOff, SearchX } from "lucide-react";
import { cx, focusRing } from "@/app/components/ui/cx";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatDate } from "@/lib/format";
import { LIMIT_REVIEWS, maskName, reviewsUrl } from "@/lib/review";
import type { Review } from "@/types/review";
import { StarRating } from "./RatingSummary";

/** Filter yang sedang aktif: id menu dan jumlah bintang (keduanya boleh kosong). */
type Filter = { menu?: number; stars?: number };

/**
 * Daftar ulasan dengan filter bintang berupa tautan (filter menu tetap dipertahankan) dan paginasi 10 per halaman.
 * @param props.rows ulasan di halaman ini
 * @param props.total jumlah ulasan yang cocok dengan filter
 * @param props.page halaman sekarang
 * @param props.filter filter aktif (menu, stars)
 * @param props.noReviews true bila toko belum punya ulasan sama sekali (pesan berbeda dari "tidak ditemukan")
 * @returns filter, daftar, dan paginasi; atau EmptyState
 */
export function ReviewList({
  rows,
  total,
  page,
  filter,
  noReviews,
}: {
  rows: Review[];
  total: number;
  page: number;
  filter: Filter;
  noReviews?: boolean;
}) {
  if (noReviews) {
    return (
      <EmptyState
        icon={MessageSquareOff}
        title="Belum ada ulasan"
        body="Ulasan muncul setelah pembeli menyelesaikan pesanan"
      />
    );
  }
  const chipClass =
    "inline-flex min-h-11 items-center rounded-md border border-line-strong px-3 text-ink hover:bg-subtle aria-[current=true]:border-primary aria-[current=true]:bg-info-bg aria-[current=true]:font-semibold";
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter bintang" className="flex flex-wrap gap-2">
        <Link
          href={reviewsUrl({ menu: filter.menu })}
          aria-current={filter.stars === undefined ? "true" : undefined}
          className={cx(chipClass, focusRing)}
        >
          Semua bintang
        </Link>
        {[5, 4, 3, 2, 1].map((starCount) => (
          <Link
            key={starCount}
            href={reviewsUrl({ menu: filter.menu, stars: starCount })}
            aria-current={filter.stars === starCount ? "true" : undefined}
            className={cx(chipClass, focusRing)}
          >
            {starCount} bintang
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ulasan tidak ditemukan"
          body="Tidak ada ulasan yang cocok dengan filter ini."
          action={
            <LinkButton variant="secondary" href="/ulasan">
              Hapus filter
            </LinkButton>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {rows.map((review) => (
              <li key={review.id} className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StarRating value={review.rating} label={`${review.rating} dari 5 bintang`} />
                  <span className="text-sm text-ink-muted">{formatDate(review.created_at)}</span>
                </div>
                <p className="text-ink">{review.comment ?? <span className="text-ink-muted">Tanpa komentar</span>}</p>
                <p className="flex flex-wrap gap-x-2 text-sm text-ink-muted">
                  <span>{maskName(review.customer_name)}</span>
                  <span aria-hidden>·</span>
                  <span>{review.menu_name}</span>
                </p>
              </li>
            ))}
          </ul>
          {total > LIMIT_REVIEWS && (
            <Pagination
              page={page}
              total={total}
              limit={LIMIT_REVIEWS}
              hrefFor={(pageNumber) => reviewsUrl({ ...filter, page: pageNumber })}
            />
          )}
        </>
      )}
    </div>
  );
}
