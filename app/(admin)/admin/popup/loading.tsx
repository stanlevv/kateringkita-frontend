import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

// PopupList: tombol buat + kartu pop-up
export default function Loading() {
  return (
    <PageFrame
      title="Pop-up"
      description="Pop-up promo saat aplikasi pembeli dibuka. Tampil sekali sehari dan berhenti setelah vouchernya diklaim."
    >
      <SkeletonList columns={3} />
    </PageFrame>
  );
}
