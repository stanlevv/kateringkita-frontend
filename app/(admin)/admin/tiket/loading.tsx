import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar, SkeletonKotak, SkeletonTab } from "@/app/components/ui/Skeleton";

// TiketTable: kotak cari, tab status, lalu tabel (≥ 1024 px) atau kartu.
export default function Loading() {
  return (
    <RangkaHalaman judul="Tiket bantuan" deskripsi="Pertanyaan dan keluhan pembeli dari aplikasi. Balasan Anda dikirim ke pembeli sebagai notifikasi.">
      <div className="flex flex-col gap-4">
        <SkeletonKotak className="h-11" />
        <SkeletonTab jumlah={4} />
        <SkeletonDaftar kolom={5} />
      </div>
    </RangkaHalaman>
  );
}
