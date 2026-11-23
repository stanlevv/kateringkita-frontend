// Kerangka memuat /pengaturan. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonSection } from "@/app/components/ui/Skeleton";

/**
 * Kerangka pengaturan: navigasi bagian (di atas pada tablet, di kiri pada layar ≥ 1024 px) lalu bagian formulir.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Pengaturan toko"
      description="Atur profil, jam buka, titik temu, rekening pencairan, pesan dari meja, dan akun."
    >
      <div className="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="flex flex-wrap gap-1 lg:flex-col">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex min-h-11 items-center px-3">
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <SkeletonSection fields={4} />
          <SkeletonSection fields={2} />
        </div>
      </div>
    </PageFrame>
  );
}
