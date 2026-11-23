import { RangkaPromo } from "@/app/components/promo/PromoListSkeleton";
import { PageFrame } from "@/app/components/shell/PageFrame";

export default function Loading() {
  return (
    <PageFrame title="Promo">
      <RangkaPromo />
    </PageFrame>
  );
}
