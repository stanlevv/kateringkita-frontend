// Kerangka memuat /pesanan. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList, SkeletonFilter } from "@/app/components/ui/Skeleton";

/**
 * Kerangka daftar pesanan: baris filter (cari, tanggal, status) lalu daftar (tabel di layar ≥ 1024 px, kartu di
 * layar kecil).
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Pesanan">
      <div className="flex flex-col gap-4">
        <SkeletonFilter selectWidths={["md:w-44", "md:w-48"]} />
        <SkeletonList columns={6} />
      </div>
    </PageFrame>
  );
}
