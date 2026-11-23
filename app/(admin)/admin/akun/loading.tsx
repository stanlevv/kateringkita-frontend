import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonField, SkeletonText } from "@/app/components/ui/Skeleton";

// Data akun (3 baris) + ChangePasswordForm (3 isian + tombol).
export default function Loading() {
  return (
    <PageFrame title="Pengaturan akun" description="Ganti kata sandi akun admin Anda.">
      <div className="flex max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2">
          <SkeletonText width="w-48" />
          <SkeletonText width="w-40" />
          <SkeletonText width="w-32" />
        </div>
        <div className="flex flex-col gap-4">
          <SkeletonField label="w-28" />
          <SkeletonField label="w-28" />
          <SkeletonField label="w-40" />
          <div>
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
