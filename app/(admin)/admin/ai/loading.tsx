import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonCard, SkeletonPills, SkeletonTable, SkeletonText } from "@/app/components/ui/Skeleton";

// Pemakaian (judul + pilihan 7/30 hari + tabel) lalu panel penyedia. Bentuk umum: halaman ini masih sering berubah.
export default function Loading() {
  return (
    <PageFrame
      title="AI"
      description="Pantau pemakaian dan atur penyedia AI untuk asisten toko & rekomendasi pembeli. Penyedia dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya."
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SkeletonText size="lg" width="w-28" />
            <SkeletonPills count={2} />
          </div>
          <SkeletonTable rows={4} columns={4} />
        </div>
        <SkeletonCard lines={3} buttons={1} />
      </div>
    </PageFrame>
  );
}
