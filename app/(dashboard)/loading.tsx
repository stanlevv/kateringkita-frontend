import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonKartu } from "@/app/components/ui/Skeleton";

// SY-3: cadangan netral untuk halaman yang belum punya loading.tsx sendiri (mis. pratinjau).
export default function Loading() {
  return (
    <RangkaHalaman>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => <SkeletonKartu key={i} />)}
      </div>
    </RangkaHalaman>
  );
}
