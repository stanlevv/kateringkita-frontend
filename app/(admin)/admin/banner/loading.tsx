import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar } from "@/app/components/ui/Skeleton";

// BannerAdmin: tombol buat banner platform + kartu banner
export default function Loading() {
  return (
    <RangkaHalaman
      judul="Banner"
      deskripsi="Banner beranda aplikasi pembeli. Pengajuan penjual menunggu persetujuan; banner platform langsung tayang."
    >
      <SkeletonDaftar kolom={3} />
    </RangkaHalaman>
  );
}
