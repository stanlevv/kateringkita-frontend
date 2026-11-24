// Tampilan memuat untuk area dashboard penjual. Next.js menampilkannya selama data halaman sedang diambil.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonCard } from "@/app/components/ui/Skeleton";

/**
 * Kerangka memuat netral untuk halaman dashboard yang belum punya loading.tsx sendiri (mis. pratinjau).
 * @returns tiga kartu kerangka di dalam rangka halaman
 */
export default function Loading() {
  return (
    <PageFrame>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </PageFrame>
  );
}
