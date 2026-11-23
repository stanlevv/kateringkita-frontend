import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonField, SkeletonTable } from "@/app/components/ui/Skeleton";

// LogFilters (4 isian) lalu tabel log.
export default function Loading() {
  return (
    <PageFrame title="Log aksi admin" description="Setiap perubahan oleh admin tercatat di sini. Hanya untuk dibaca.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonField key={i} label="w-20" />
        ))}
      </div>
      <SkeletonTable rows={8} columns={5} />
    </PageFrame>
  );
}
