import { PromoList } from "@/app/components/promo/PromoList";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPromos } from "@/services/promo.service";
import { requireMerchant } from "@/services/auth.service";

// M-13 — Promo toko (PR-N1…N3, PR-E1/E2, PR-S1).
export default async function PromoPage() {
  await requireMerchant();
  const promos = await getPromos();
  return (
    <PageHeader title="Promo">
      <PromoList promos={"data" in promos ? promos.data : []} galat={"error" in promos} />
    </PageHeader>
  );
}
