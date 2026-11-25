// Kerangka memuat /admin/penjual/<id>/menu. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

/**
 * Kerangka MerchantMenuList: tabel menu toko.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Menu toko" description="Menu yang ditambah admin tampil tanpa foto sampai penjual mengunggahnya.">
      <div className="flex flex-col gap-4">
        <SkeletonList columns={4} />
      </div>
    </PageFrame>
  );
}
