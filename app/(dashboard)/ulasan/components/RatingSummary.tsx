import Link from "next/link";
import { Star } from "lucide-react";
import { cx, fokus } from "@/app/components/ui/cx";
import { ringkasPerMenu, ringkasUlasan, urlUlasan } from "@/lib/ulasan";
import type { Review } from "@/types/review";

const desimal = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Bintang sebagai ikon; pembaca layar mendapat teks "4 dari 5 bintang". */
export function Bintang({ nilai, teks }: { nilai: number; teks?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={cx("size-4", i <= Math.round(nilai) ? "fill-current text-warning" : "text-line-strong")} />
      ))}
      <span className="sr-only">{teks ?? `${nilai} dari 5 bintang`}</span>
    </span>
  );
}

/** UL-N1: rata-rata toko, jumlah ulasan, sebaran 5→1. */
export function RatingSummary({ reviews }: { reviews: Review[] }) {
  const { total, rata, sebaran } = ringkasUlasan(reviews);
  return (
    <section aria-label="Ringkasan ulasan" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-4xl font-bold text-ink">{desimal(rata)}</span>
        <Bintang nilai={rata} teks={`${desimal(rata)} dari 5 bintang`} />
        <span className="text-ink-muted">dari {total} ulasan</span>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {sebaran.map((s) => (
          <li key={s.bintang} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-ink">{s.bintang} bintang</span>
            <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
              <span className="block h-full rounded-full bg-warning" style={{ width: `${total ? (s.jumlah / total) * 100 : 0}%` }} />
            </span>
            <span data-testid="jumlah" className="w-8 shrink-0 text-right font-mono text-sm text-ink">{s.jumlah}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** UL-N2: rata-rata per menu; tautan menyaring daftar lewat ?menu=. */
export function MenuRatings({ reviews, menus, menuId }: { reviews: Review[]; menus: { id: number; name: string }[]; menuId?: number }) {
  const baris = "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md px-3 py-2 text-ink hover:bg-subtle aria-[current=true]:bg-info-bg aria-[current=true]:font-semibold";
  return (
    <nav aria-label="Ulasan per menu" className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-2">
      <Link href="/ulasan" aria-current={menuId === undefined ? "true" : undefined} className={cx(baris, fokus)}>Semua menu</Link>
      {ringkasPerMenu(reviews, menus).map((m) => (
        <Link key={m.menu_id} href={urlUlasan({ menu: m.menu_id })} aria-current={menuId === m.menu_id ? "true" : undefined} className={cx(baris, fokus)}>
          <span title={m.menu_name} className="min-w-0 break-words">{m.menu_name}</span>
          <span className="flex shrink-0 items-center gap-2 text-sm">
            {m.jumlah > 0 ? (<><Bintang nilai={m.rata} teks={`${desimal(m.rata)} dari 5 bintang`} /><span className="font-mono">{desimal(m.rata)}</span></>) : null}
            <span className="text-ink-muted">{m.jumlah > 0 ? `${m.jumlah} ulasan` : "Belum ada ulasan"}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
