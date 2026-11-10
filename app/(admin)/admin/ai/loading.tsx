import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonKartu, SkeletonPil, SkeletonTabel, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Pemakaian (judul + pilihan 7/30 hari + tabel) lalu panel penyedia. Bentuk umum: halaman ini masih sering berubah.
export default function Loading() {
  return (
    <RangkaHalaman
      judul="AI"
      deskripsi="Pantau pemakaian dan atur penyedia AI untuk asisten toko & rekomendasi pembeli. Penyedia dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya."
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><SkeletonTeks ukuran="lg" lebar="w-28" /><SkeletonPil jumlah={2} /></div>
          <SkeletonTabel baris={4} kolom={4} />
        </div>
        <SkeletonKartu baris={3} tombol={1} />
      </div>
    </RangkaHalaman>
  );
}
