// Kerangka memuat /promo. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PromoListSkeleton } from "@/app/components/promo/PromoListSkeleton";
import { PageFrame } from "@/app/components/shell/PageFrame";

/**
 * Kerangka halaman promo (tombol buat + grid kartu).
 * @returns PageFrame berisi PromoListSkeleton
 */
export default function Loading() {
  return (
    <PageFrame title="Promo">
      <PromoListSkeleton />
    </PageFrame>
  );
}
