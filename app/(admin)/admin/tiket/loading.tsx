// Kerangka memuat /admin/tiket. loading.tsx tampil otomatis selama page.tsx menunggu data dari backend.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList, SkeletonBox, SkeletonTabs } from "@/app/components/ui/Skeleton";

/**
 * Kerangka TicketTable: kotak cari, tab status, lalu tabel (≥ 1024 px) atau kartu.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Tiket bantuan"
      description="Pertanyaan dan keluhan pembeli dari aplikasi. Balasan Anda dikirim ke pembeli sebagai notifikasi."
    >
      <div className="flex flex-col gap-4">
        <SkeletonBox className="h-11" />
        <SkeletonTabs count={4} />
        <SkeletonList columns={5} />
      </div>
    </PageFrame>
  );
}
