// Kerangka memuat /admin/pembeli/<id>. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka detail pembeli: status akun, data kontak, dan empat angka ringkasan pesanan. Judul (nama pembeli) belum
 * diketahui, jadi PageFrame tanpa judul.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      actions={
        <LinkButton href="/admin/pembeli" variant="secondary">
          Semua pembeli
        </LinkButton>
      }
    >
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonText width="w-20" />
              <SkeletonText width="w-40" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
