import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";

// Antrean verifikasi: kartu toko (nama, pemilik & WA, catatan, tombol setujui/tolak).
export default function Loading() {
  return (
    <PageFrame
      title="Verifikasi penjual"
      description="Periksa toko baru atau yang sudah diperbaiki. Yang paling lama menunggu ada di atas."
    >
      <ul className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
            <div className="flex justify-between gap-2">
              <SkeletonText size="lg" width="w-48" />
              <Skeleton className="h-8 w-28" />
            </div>
            <SkeletonText size="sm" width="w-72" />
            <SkeletonText size="sm" width="w-56" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-11 w-28" />
              <Skeleton className="h-11 w-36" />
            </div>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}
