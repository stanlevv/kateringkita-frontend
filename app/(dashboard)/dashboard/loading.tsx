import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonKartu, SkeletonKpi, SkeletonTab, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Bentuk OrderCard: kode & jam, pembeli, item, titik temu, total + tombol.
function KartuPesanan() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 pt-5">
      <div className="flex justify-between gap-2"><SkeletonTeks ukuran="sm" lebar="w-20" /><SkeletonTeks ukuran="sm" lebar="w-24" /></div>
      <SkeletonTeks lebar="w-48" />
      <div className="flex flex-col gap-1"><SkeletonTeks lebar="w-40" /><SkeletonTeks lebar="w-28" /></div>
      <SkeletonTeks ukuran="sm" lebar="w-36" />
      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonTeks lebar="w-32" />
        <div className="flex gap-2"><Skeleton className="h-11 w-28" /><Skeleton className="h-11 w-32" /></div>
      </div>
    </div>
  );
}

// DB-S1: 4 KPI, tab antrean + kartu pesanan, panel kuota & menu terlaris (panel hanya ≥ 1280 px, di tablet jadi tab).
export default function Loading() {
  return (
    <RangkaHalaman judul="Dashboard" deskripsi="Antrean pesanan dan kuota hari ini" aksi={<Skeleton className="size-11" />}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonKpi key={i} />)}</div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-4">
            <SkeletonTab />
            <div className="grid gap-4 2xl:grid-cols-2">{[0, 1, 2, 3].map((i) => <KartuPesanan key={i} />)}</div>
          </div>
          <div className="hidden flex-col gap-4 xl:flex">
            <div className="rounded-lg border border-line bg-surface p-4">
              <SkeletonTeks ukuran="lg" lebar="w-36" />
              <ul className="mt-1">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
                    <SkeletonTeks lebar="w-36" />
                    <SkeletonTeks ukuran="sm" lebar="w-52" />
                    <Skeleton className="h-11 w-46" />
                  </li>
                ))}
              </ul>
            </div>
            <SkeletonKartu baris={1} />
          </div>
        </div>
      </div>
    </RangkaHalaman>
  );
}
