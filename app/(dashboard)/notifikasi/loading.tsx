// Kerangka memuat /notifikasi. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka daftar notifikasi: ikon, judul, isi, dan waktu untuk lima baris.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Notifikasi" description="Pengumuman dari admin dan kabar tentang toko kamu.">
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-3 p-4">
            <Skeleton className="size-5 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonText width="w-48" />
              <SkeletonText size="sm" width="w-full" />
              <SkeletonText size="sm" width="w-24" />
            </div>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}
