import { RangkaPromo } from "@/app/components/promo/RangkaPromo";
import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";

export default function Loading() {
  return (
    <RangkaHalaman judul="Promo">
      <RangkaPromo />
    </RangkaHalaman>
  );
}
