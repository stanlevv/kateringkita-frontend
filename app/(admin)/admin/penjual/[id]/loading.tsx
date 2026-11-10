import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonTeks } from "@/app/components/ui/Skeleton";

// MerchantDetail: lencana status, lalu bagian berisi pasangan label–nilai. Judul (nama toko) dikerangkakan.
export default function Loading() {
  return (
    <RangkaHalaman aksi={<LinkButton href="/admin/penjual" variant="secondary">Semua penjual</LinkButton>}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-20" /></div>
        {[5, 3, 2].map((n, i) => (
          <div key={i} className="rounded-lg border border-line bg-surface p-4">
            <SkeletonTeks ukuran="lg" lebar="w-32" className="mb-3" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: n }, (_, j) => (
                <div key={j} className="flex flex-col sm:flex-row sm:gap-4"><SkeletonTeks lebar="w-24" className="w-40 shrink-0" /><SkeletonTeks lebar="w-48" /></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RangkaHalaman>
  );
}
