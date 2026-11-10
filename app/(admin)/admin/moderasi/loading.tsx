import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonKotak, SkeletonPil, SkeletonTabel } from "@/app/components/ui/Skeleton";

// Pil jenis, pil status + cari, lalu tabel moderasi.
export default function Loading() {
  return (
    <RangkaHalaman judul="Moderasi" deskripsi="Sembunyikan ulasan atau turunkan menu yang melanggar. Untuk menangguhkan toko, buka halaman Penjual.">
      <div className="flex flex-col gap-4">
        <SkeletonPil jumlah={2} />
        <div className="flex flex-wrap items-end gap-3"><SkeletonPil jumlah={3} /><SkeletonKotak className="h-11 w-60" /></div>
        <SkeletonTabel baris={6} kolom={5} />
      </div>
    </RangkaHalaman>
  );
}
