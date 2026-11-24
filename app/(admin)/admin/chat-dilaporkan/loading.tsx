// Kerangka memuat /admin/chat-dilaporkan, tampil otomatis selama page.tsx menunggu data dari backend.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

/**
 * Kerangka daftar laporan chat.
 * @returns PageFrame berisi kerangka daftar
 */
export default function Loading() {
  return (
    <PageFrame
      title="Chat dilaporkan"
      description="Chat pesanan yang dilaporkan pembeli atau penjual. Laporan yang belum dibuka ada di atas. Halaman ini hanya untuk membaca."
    >
      <SkeletonList columns={3} />
    </PageFrame>
  );
}
