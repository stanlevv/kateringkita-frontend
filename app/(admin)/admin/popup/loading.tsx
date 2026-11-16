import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar } from "@/app/components/ui/Skeleton";

// DaftarPopup: tombol buat + kartu pop-up
export default function Loading() {
  return (
    <RangkaHalaman judul="Pop-up" deskripsi="Pop-up promo saat aplikasi pembeli dibuka. Tampil sekali sehari dan berhenti setelah vouchernya diklaim.">
      <SkeletonDaftar kolom={3} />
    </RangkaHalaman>
  );
}
