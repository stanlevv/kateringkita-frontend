// Kerangka memuat /menu.
// loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonBox, SkeletonTabs, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka katalog menu: cari dan kategori, tab status, lalu kartu seperti MenuCard (foto 16:9, nama, harga, stok,
 * stepper kuota, tombol).
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Menu & Stok" actions={<LinkButton href="/menu/baru">Tambah menu</LinkButton>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SkeletonBox className="h-11 flex-1" />
          <SkeletonBox className="h-11 sm:w-56" />
        </div>
        <SkeletonTabs />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
              <div className="aspect-[16/9] bg-subtle" />
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <SkeletonText width="w-40" />
                  <SkeletonText size="sm" width="w-24" />
                </div>
                <SkeletonText width="w-48" />
                <SkeletonText size="sm" width="w-56" />
                <Skeleton className="h-11 w-46" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-11 w-24" />
                  <Skeleton className="h-11 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
