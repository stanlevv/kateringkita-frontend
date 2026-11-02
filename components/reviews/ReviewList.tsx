import Link from "next/link";
import { MessageSquareOff, SearchX } from "lucide-react";
import { cx, fokus } from "@/components/ui/cx";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pagination } from "@/components/ui/Pagination";
import { formatTanggal } from "@/lib/format";
import { LIMIT_ULASAN, samarkanNama, urlUlasan } from "@/lib/ulasan";
import type { Review } from "@/lib/types";
import { Bintang } from "./RatingSummary";

type Filter = { menu?: number; bintang?: number };

/** UL-N3, UL-S1: filter bintang (tautan), daftar ulasan, paginasi 10 lewat URL. */
export function ReviewList({ rows, total, page, filter, kosongSemua }: { rows: Review[]; total: number; page: number; filter: Filter; kosongSemua?: boolean }) {
  if (kosongSemua) {
    return <EmptyState icon={MessageSquareOff} title="Belum ada ulasan" body="Ulasan muncul setelah pembeli menyelesaikan pesanan" />;
  }
  const chip = "inline-flex min-h-11 items-center rounded-md border border-line-strong px-3 text-ink hover:bg-subtle aria-[current=true]:border-primary aria-[current=true]:bg-info-bg aria-[current=true]:font-semibold";
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter bintang" className="flex flex-wrap gap-2">
        <Link href={urlUlasan({ menu: filter.menu })} aria-current={filter.bintang === undefined ? "true" : undefined} className={cx(chip, fokus)}>Semua bintang</Link>
        {[5, 4, 3, 2, 1].map((b) => (
          <Link key={b} href={urlUlasan({ menu: filter.menu, bintang: b })} aria-current={filter.bintang === b ? "true" : undefined} className={cx(chip, fokus)}>{b} bintang</Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState icon={SearchX} title="Ulasan tidak ditemukan" body="Tidak ada ulasan yang cocok dengan filter ini."
          action={<LinkButton variant="secondary" href="/ulasan">Hapus filter</LinkButton>} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Bintang nilai={r.rating} teks={`${r.rating} dari 5 bintang`} />
                  <span className="text-sm text-ink-muted">{formatTanggal(r.created_at)}</span>
                </div>
                <p className="text-ink">{r.comment ?? <span className="text-ink-muted">Tanpa komentar</span>}</p>
                <p className="flex flex-wrap gap-x-2 text-sm text-ink-muted"><span>{samarkanNama(r.customer_name)}</span><span aria-hidden>·</span><span>{r.menu_name}</span></p>
              </li>
            ))}
          </ul>
          {total > LIMIT_ULASAN && <Pagination page={page} total={total} limit={LIMIT_ULASAN} hrefFor={(p) => urlUlasan({ ...filter, page: p })} />}
        </>
      )}
    </div>
  );
}
