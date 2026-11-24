// Kerangka memuat /admin/pembeli. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonFilter, SkeletonList } from "@/app/components/ui/Skeleton";

/**
 * Kerangka CustomerTable: kotak cari, filter status, lalu tabel.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Pembeli" description="Semua akun pembeli yang terdaftar.">
      <div className="flex flex-col gap-4">
        <SkeletonFilter selectWidths={["md:w-40"]} />
        <SkeletonList columns={6} />
      </div>
    </PageFrame>
  );
}
