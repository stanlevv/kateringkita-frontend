// Kerangka memuat /banner. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

/**
 * Kerangka MerchantBanners: tombol ajukan dan kartu banner dua kolom.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Banner"
      description="Pasang banner tokomu di beranda aplikasi pembeli. Tampil setelah disetujui admin."
    >
      <SkeletonList columns={2} />
    </PageFrame>
  );
}
