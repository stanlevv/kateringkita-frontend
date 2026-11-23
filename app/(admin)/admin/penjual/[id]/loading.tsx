import { PageFrame } from "@/app/components/shell/PageFrame";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";

// MerchantDetail: lencana status, lalu bagian berisi pasangan label–nilai. Judul (nama toko) dikerangkakan.
export default function Loading() {
  return (
    <PageFrame
      actions={
        <LinkButton href="/admin/penjual" variant="secondary">
          Semua penjual
        </LinkButton>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        {[5, 3, 2].map((rowCount, i) => (
          <div key={i} className="rounded-lg border border-line bg-surface p-4">
            <SkeletonText size="lg" width="w-32" className="mb-3" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: rowCount }, (_, j) => (
                <div key={j} className="flex flex-col sm:flex-row sm:gap-4">
                  <SkeletonText width="w-24" className="w-40 shrink-0" />
                  <SkeletonText width="w-48" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
