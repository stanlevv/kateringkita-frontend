import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonCard } from "@/app/components/ui/Skeleton";

// SY-3: cadangan netral untuk halaman yang belum punya loading.tsx sendiri (mis. pratinjau).
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
