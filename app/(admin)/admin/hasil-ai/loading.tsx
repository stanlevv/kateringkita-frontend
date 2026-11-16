import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar, SkeletonTab } from "@/app/components/ui/Skeleton";

// DaftarHasilAi: tab status + pilihan fitur, lalu kartu hasil AI.
export default function Loading() {
  return (
    <RangkaHalaman
      judul="Verifikasi AI"
      deskripsi="Keluaran asisten toko dan rekomendasi pembeli yang sudah lolos validasi format. Periksa, lalu setujui atau tolak dengan alasan."
    >
      <div className="flex flex-col gap-4">
        <SkeletonTab jumlah={4} />
        <SkeletonDaftar kolom={3} />
      </div>
    </RangkaHalaman>
  );
}
