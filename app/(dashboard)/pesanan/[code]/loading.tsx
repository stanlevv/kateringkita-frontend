import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonTeks } from "@/app/components/ui/Skeleton";
import { KembaliKePesanan } from "../components/KembaliKePesanan";

// PS-N2: tautan kembali langsung bisa diklik; judul (kode pesanan) dan OrderDetail dikerangkakan.
export default function Loading() {
  return (
    <>
      <KembaliKePesanan />
      <RangkaHalaman>
        <div className="flex max-w-2xl flex-col gap-6 rounded-lg border border-line bg-surface p-5">
          <div className="flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-28" /></div>
          <div className="flex flex-col gap-3">
            <SkeletonTeks lebar="w-20" />
            <SkeletonTeks ukuran="sm" lebar="w-56" />
            <SkeletonTeks ukuran="sm" lebar="w-64" />
          </div>
          <div className="flex flex-col gap-3">
            <SkeletonTeks lebar="w-24" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between gap-3"><SkeletonTeks ukuran="sm" lebar="w-44" /><SkeletonTeks ukuran="sm" lebar="w-20" /></div>
            ))}
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between gap-3"><SkeletonTeks ukuran="sm" lebar="w-24" /><SkeletonTeks ukuran="sm" lebar="w-20" /></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row"><Skeleton className="h-11 w-40" /><Skeleton className="h-11 w-36" /></div>
        </div>
      </RangkaHalaman>
    </>
  );
}
