// Kerangka memuat /admin/chat-dilaporkan/<id>. loading.tsx tampil otomatis selama page.tsx menunggu data laporan.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";
import { cx } from "@/app/components/ui/cx";

/**
 * Kerangka halaman baca laporan: kotak laporan lalu gelembung pesan kiri/kanan. Judul (kode pesanan) berasal dari
 * data, jadi tidak ditulis; tautan kembali sudah bisa diklik.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      actions={
        <LinkButton href="/admin/chat-dilaporkan" variant="secondary">
          Semua laporan
        </LinkButton>
      }
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        {[false, true, false].map((isMerchant, index) => (
          <div key={index} className={cx("flex flex-col gap-1", isMerchant ? "items-end" : "items-start")}>
            <Skeleton className="h-14 w-3/4" />
            <SkeletonText size="sm" width="w-36" />
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
