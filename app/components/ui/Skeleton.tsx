import { Card } from "./Card";
import { cx } from "./cx";

// Kerangka memuat (SY-3). Bentuknya meniru komponen asli (Card, KpiCard, DataTable, Field, Tabs) supaya tata letak
// tidak melompat saat data datang. Isian bg-line tetap terlihat di atas canvas maupun surface.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        "relative overflow-hidden rounded-md bg-line after:absolute after:inset-0 after:animate-kilau after:bg-linear-to-r after:from-transparent after:via-surface/70 after:to-transparent motion-reduce:after:hidden",
        className,
      )}
    />
  );
}

const LINE_HEIGHTS = { sm: "h-5", base: "h-6", lg: "h-7", "2xl": "h-8", "4xl": "h-10" };

/** Satu baris teks: kotaknya setinggi line-height teks asli (text-sm 20 px, base 24 px, …), batangnya lebih tipis. */
export function SkeletonText({
  size = "base",
  width,
  className,
}: {
  size?: keyof typeof LINE_HEIGHTS;
  width?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx("flex flex-col justify-center", LINE_HEIGHTS[size], className)}>
      <Skeleton className={cx("h-[55%]", width)} />
    </div>
  );
}

/** Bingkai kosong seperti Input/Select yang belum terisi. */
export function SkeletonBox({ className }: { className?: string }) {
  return <div aria-hidden className={cx("rounded-md border border-line bg-surface", className)} />;
}

/** Field + Input: label text-sm, jarak 6 px, kotak isian 44 px (Textarea: `tinggi="h-24"`). */
export function SkeletonField({ height = "h-11", label = "w-24" }: { height?: string; label?: string }) {
  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <SkeletonText size="sm" width={label} />
      <SkeletonBox className={height} />
    </div>
  );
}

/** KpiCard: label, angka text-2xl, keterangan. */
export function SkeletonKpi() {
  return (
    <Card aria-hidden>
      <SkeletonText size="sm" width="w-28" />
      <SkeletonText size="2xl" width="w-32" className="mt-1" />
      <SkeletonText size="sm" width="w-40" className="mt-1" />
    </Card>
  );
}

/** Card berisi judul text-lg, `baris` baris teks, dan `tombol` tombol di bawah. */
export function SkeletonCard({
  withTitle = true,
  lines = 2,
  buttons = 0,
  className,
}: {
  withTitle?: boolean;
  lines?: number;
  buttons?: number;
  className?: string;
}) {
  return (
    <Card aria-hidden className={cx("flex flex-col gap-2", className)}>
      {withTitle && <SkeletonText size="lg" width="w-40" />}
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonText key={i} width={i % 2 ? "w-1/2" : "w-4/5"} />
      ))}
      {buttons > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {Array.from({ length: buttons }, (_, i) => (
            <Skeleton key={i} className="h-11 w-24" />
          ))}
        </div>
      )}
    </Card>
  );
}

/** Bagian formulir (section berbingkai): judul text-lg + `isian` Field. */
export function SkeletonSection({ fields = 3 }: { fields?: number }) {
  return (
    <Card aria-hidden className="flex flex-col gap-4 sm:p-6">
      <SkeletonText size="lg" width="w-36" />
      {Array.from({ length: fields }, (_, i) => (
        <SkeletonField key={i} label={i % 2 ? "w-20" : "w-28"} />
      ))}
    </Card>
  );
}

/** DataTable: kepala bg-subtle + baris 44 px bergaris. */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const cells = Array.from({ length: columns }, (_, i) => (
    <SkeletonText key={i} size="sm" width={i === 0 ? "w-24" : "w-16"} className="flex-1" />
  ));
  return (
    <div aria-hidden className="overflow-hidden rounded-lg border border-line">
      <div className="flex gap-6 bg-subtle px-4 py-3">{cells}</div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-6 border-t border-line px-4 py-3">
          {cells}
        </div>
      ))}
    </div>
  );
}

/** Daftar yang tampil sebagai DataTable di ≥ 1024 px dan kartu di bawahnya (OrderTable, MerchantTable, TransactionTable). */
export function SkeletonList({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      <div className="hidden lg:block">
        <SkeletonTable rows={rows} columns={columns} />
      </div>
      <div className="flex flex-col gap-3 lg:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <SkeletonCard key={i} withTitle={false} lines={3} />
        ))}
      </div>
    </>
  );
}

// Tinggi batang tetap (bukan acak) supaya HTML server dan klien sama.
const BAR_HEIGHTS = [
  "h-[35%]",
  "h-[55%]",
  "h-[80%]",
  "h-[60%]",
  "h-[90%]",
  "h-[70%]",
  "h-[45%]",
  "h-[65%]",
  "h-[85%]",
  "h-[50%]",
  "h-[30%]",
  "h-[40%]",
];

/** Grafik batang (HourlyChart, GrafikBatang): sumbu bawah + batang. `className` memberi tinggi area (aspect-* atau h-*). */
export function SkeletonChart({ bars = 12, className }: { bars?: number; className?: string }) {
  return (
    <div aria-hidden className={cx("flex w-full items-end gap-1 border-b border-line", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <Skeleton key={i} className={cx("flex-1 rounded-b-none", BAR_HEIGHTS[i % BAR_HEIGHTS.length])} />
      ))}
    </div>
  );
}

/** Tabs: deretan label di atas garis bawah. */
export function SkeletonTabs({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden className="flex h-11 items-center gap-8 border-b border-line px-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-3 w-20" />
      ))}
    </div>
  );
}

/** Deretan tombol pil (RangePicker, filter chip). */
export function SkeletonPills({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-11 w-24" />
      ))}
    </div>
  );
}

/** Baris filter daftar: kotak cari + select berlabel (`pilihan` = lebar md:w-* tiap select). */
export function SkeletonFilter({ selectWidths = [] }: { selectWidths?: string[] }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 md:flex-row md:items-end">
      <SkeletonBox className="h-11 flex-1" />
      {selectWidths.map((widthClass, i) => (
        <div key={i} className={cx("flex flex-col gap-1", widthClass)}>
          <SkeletonText size="sm" width="w-14" />
          <SkeletonBox className="h-11" />
        </div>
      ))}
    </div>
  );
}
