// Kerangka memuat /admin/tiket/<kode>. loading.tsx tampil otomatis selama page.tsx menunggu data tiket.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Card } from "@/app/components/ui/Card";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonBox, SkeletonText } from "@/app/components/ui/Skeleton";
import { cx } from "@/app/components/ui/cx";

/**
 * Kerangka TicketDetailView: baris info, percakapan (gelembung kiri/kanan + formulir balas), kartu pembeli & pesanan.
 * Judul halaman (judul tiket) berasal dari data, jadi tidak ditulis; tautan kembali sudah bisa diklik.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      actions={
        <LinkButton href="/admin/tiket" variant="secondary">
          Semua tiket
        </LinkButton>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-7 w-24" />
          <SkeletonText width="w-40" />
          <SkeletonText width="w-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <Card className="flex flex-col gap-4 lg:col-span-2">
            <SkeletonText size="lg" width="w-32" />
            {[false, true, false].map((isAdmin, i) => (
              <div key={i} className={cx("flex flex-col gap-1", isAdmin ? "items-end" : "items-start")}>
                <Skeleton className="h-20 w-3/4" />
                <SkeletonText size="sm" width="w-36" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5 border-t border-line pt-4">
              <SkeletonText size="sm" width="w-40" />
              <SkeletonBox className="h-28" />
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            {[3, 5].map((lineCount, i) => (
              <Card key={i} className="flex flex-col gap-2">
                <SkeletonText size="lg" width="w-28" />
                {Array.from({ length: lineCount }, (_, j) => (
                  <div key={j}>
                    <SkeletonText size="sm" width="w-16" />
                    <SkeletonText width="w-40" />
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
