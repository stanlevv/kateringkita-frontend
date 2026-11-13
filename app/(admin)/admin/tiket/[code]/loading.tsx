import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonKotak, SkeletonTeks } from "@/app/components/ui/Skeleton";
import { cx } from "@/app/components/ui/cx";

// TiketDetail: baris info, percakapan (gelembung kiri/kanan + formulir balas), kartu pembeli & pesanan.
// Judul (judul tiket) dari data, jadi ikut dikerangkakan; tautan kembali langsung bisa diklik.
export default function Loading() {
  return (
    <RangkaHalaman aksi={<LinkButton href="/admin/tiket" variant="secondary">Semua tiket</LinkButton>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3"><Skeleton className="h-7 w-24" /><SkeletonTeks lebar="w-40" /><SkeletonTeks lebar="w-32" /></div>
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <Card className="flex flex-col gap-4 lg:col-span-2">
            <SkeletonTeks ukuran="lg" lebar="w-32" />
            {[false, true, false].map((admin, i) => (
              <div key={i} className={cx("flex flex-col gap-1", admin ? "items-end" : "items-start")}>
                <Skeleton className="h-20 w-3/4" />
                <SkeletonTeks ukuran="sm" lebar="w-36" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5 border-t border-line pt-4">
              <SkeletonTeks ukuran="sm" lebar="w-40" />
              <SkeletonKotak className="h-28" />
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            {[3, 5].map((n, i) => (
              <Card key={i} className="flex flex-col gap-2">
                <SkeletonTeks ukuran="lg" lebar="w-28" />
                {Array.from({ length: n }, (_, j) => <div key={j}><SkeletonTeks ukuran="sm" lebar="w-16" /><SkeletonTeks lebar="w-40" /></div>)}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RangkaHalaman>
  );
}
