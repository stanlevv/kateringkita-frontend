import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar } from "@/app/components/ui/Skeleton";

// BannerToko: tombol ajukan + kartu banner
export default function Loading() {
  return (
    <RangkaHalaman
      judul="Banner"
      deskripsi="Pasang banner tokomu di beranda aplikasi pembeli. Tampil setelah disetujui admin."
    >
      <SkeletonDaftar kolom={2} />
    </RangkaHalaman>
  );
}
