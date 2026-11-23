import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList, SkeletonFilter } from "@/app/components/ui/Skeleton";

// MerchantTable: cari + status + dapur, lalu tabel (≥ 1024 px) atau kartu.
export default function Loading() {
  return (
    <PageFrame title="Penjual" description="Semua penjual yang terdaftar.">
      <div className="flex flex-col gap-4">
        <SkeletonFilter selectWidths={["md:w-48", "md:w-40"]} />
        <SkeletonList columns={5} />
      </div>
    </PageFrame>
  );
}
