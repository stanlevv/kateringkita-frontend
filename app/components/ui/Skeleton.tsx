import { Card } from "./Card";
import { cx } from "./cx";

// Kerangka memuat (SY-3). Bentuknya meniru komponen asli (Card, KpiCard, DataTable, Field, Tabs) supaya tata letak
// tidak melompat saat data datang. Isian bg-line tetap terlihat di atas canvas maupun surface.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("relative overflow-hidden rounded-md bg-line after:absolute after:inset-0 after:animate-kilau after:bg-linear-to-r after:from-transparent after:via-surface/70 after:to-transparent motion-reduce:after:hidden", className)}
    />
  );
}

const BARIS = { sm: "h-5", base: "h-6", lg: "h-7", "2xl": "h-8", "4xl": "h-10" };

/** Satu baris teks: kotaknya setinggi line-height teks asli (text-sm 20 px, base 24 px, …), batangnya lebih tipis. */
export function SkeletonTeks({ ukuran = "base", lebar, className }: { ukuran?: keyof typeof BARIS; lebar?: string; className?: string }) {
  return (
    <div aria-hidden className={cx("flex flex-col justify-center", BARIS[ukuran], className)}>
      <Skeleton className={cx("h-[55%]", lebar)} />
    </div>
  );
}

/** Bingkai kosong seperti Input/Select yang belum terisi. */
export function SkeletonKotak({ className }: { className?: string }) {
  return <div aria-hidden className={cx("rounded-md border border-line bg-surface", className)} />;
}

/** Field + Input: label text-sm, jarak 6 px, kotak isian 44 px (Textarea: `tinggi="h-24"`). */
export function SkeletonIsian({ tinggi = "h-11", label = "w-24" }: { tinggi?: string; label?: string }) {
  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <SkeletonTeks ukuran="sm" lebar={label} />
      <SkeletonKotak className={tinggi} />
    </div>
  );
}

/** KpiCard: label, angka text-2xl, keterangan. */
export function SkeletonKpi() {
  return (
    <Card aria-hidden>
      <SkeletonTeks ukuran="sm" lebar="w-28" />
      <SkeletonTeks ukuran="2xl" lebar="w-32" className="mt-1" />
      <SkeletonTeks ukuran="sm" lebar="w-40" className="mt-1" />
    </Card>
  );
}

/** Card berisi judul text-lg, `baris` baris teks, dan `tombol` tombol di bawah. */
export function SkeletonKartu({ judul = true, baris = 2, tombol = 0, className }: { judul?: boolean; baris?: number; tombol?: number; className?: string }) {
  return (
    <Card aria-hidden className={cx("flex flex-col gap-2", className)}>
      {judul && <SkeletonTeks ukuran="lg" lebar="w-40" />}
      {Array.from({ length: baris }, (_, i) => <SkeletonTeks key={i} lebar={i % 2 ? "w-1/2" : "w-4/5"} />)}
      {tombol > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {Array.from({ length: tombol }, (_, i) => <Skeleton key={i} className="h-11 w-24" />)}
        </div>
      )}
    </Card>
  );
}

/** Bagian formulir (section berbingkai): judul text-lg + `isian` Field. */
export function SkeletonBagian({ isian = 3 }: { isian?: number }) {
  return (
    <Card aria-hidden className="flex flex-col gap-4 sm:p-6">
      <SkeletonTeks ukuran="lg" lebar="w-36" />
      {Array.from({ length: isian }, (_, i) => <SkeletonIsian key={i} label={i % 2 ? "w-20" : "w-28"} />)}
    </Card>
  );
}

/** DataTable: kepala bg-subtle + baris 44 px bergaris. */
export function SkeletonTabel({ baris = 5, kolom = 4 }: { baris?: number; kolom?: number }) {
  const sel = Array.from({ length: kolom }, (_, i) => <SkeletonTeks key={i} ukuran="sm" lebar={i === 0 ? "w-24" : "w-16"} className="flex-1" />);
  return (
    <div aria-hidden className="overflow-hidden rounded-lg border border-line">
      <div className="flex gap-6 bg-subtle px-4 py-3">{sel}</div>
      {Array.from({ length: baris }, (_, r) => <div key={r} className="flex gap-6 border-t border-line px-4 py-3">{sel}</div>)}
    </div>
  );
}

/** Daftar yang tampil sebagai DataTable di ≥ 1024 px dan kartu di bawahnya (OrderTable, MerchantTable, TransactionTable). */
export function SkeletonDaftar({ baris = 6, kolom = 5 }: { baris?: number; kolom?: number }) {
  return (
    <>
      <div className="hidden lg:block"><SkeletonTabel baris={baris} kolom={kolom} /></div>
      <div className="flex flex-col gap-3 lg:hidden">
        {Array.from({ length: Math.min(baris, 4) }, (_, i) => <SkeletonKartu key={i} judul={false} baris={3} />)}
      </div>
    </>
  );
}

// Tinggi batang tetap (bukan acak) supaya HTML server dan klien sama.
const BATANG = ["h-[35%]", "h-[55%]", "h-[80%]", "h-[60%]", "h-[90%]", "h-[70%]", "h-[45%]", "h-[65%]", "h-[85%]", "h-[50%]", "h-[30%]", "h-[40%]"];

/** Grafik batang (HourlyChart, GrafikBatang): sumbu bawah + batang. `className` memberi tinggi area (aspect-* atau h-*). */
export function SkeletonGrafik({ batang = 12, className }: { batang?: number; className?: string }) {
  return (
    <div aria-hidden className={cx("flex w-full items-end gap-1 border-b border-line", className)}>
      {Array.from({ length: batang }, (_, i) => <Skeleton key={i} className={cx("flex-1 rounded-b-none", BATANG[i % BATANG.length])} />)}
    </div>
  );
}

/** Tabs: deretan label di atas garis bawah. */
export function SkeletonTab({ jumlah = 3 }: { jumlah?: number }) {
  return (
    <div aria-hidden className="flex h-11 items-center gap-8 border-b border-line px-4">
      {Array.from({ length: jumlah }, (_, i) => <Skeleton key={i} className="h-3 w-20" />)}
    </div>
  );
}

/** Deretan tombol pil (RangePicker, filter chip). */
export function SkeletonPil({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <div aria-hidden className="flex flex-wrap gap-2">
      {Array.from({ length: jumlah }, (_, i) => <Skeleton key={i} className="h-11 w-24" />)}
    </div>
  );
}

/** Baris filter daftar: kotak cari + select berlabel (`pilihan` = lebar md:w-* tiap select). */
export function SkeletonFilter({ pilihan = [] }: { pilihan?: string[] }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 md:flex-row md:items-end">
      <SkeletonKotak className="h-11 flex-1" />
      {pilihan.map((w, i) => (
        <div key={i} className={cx("flex flex-col gap-1", w)}>
          <SkeletonTeks ukuran="sm" lebar="w-14" />
          <SkeletonKotak className="h-11" />
        </div>
      ))}
    </div>
  );
}
