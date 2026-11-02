import { PromoList } from "@/components/promo/PromoList";
import { PageHeader } from "@/components/shell/PageHeader";
import { getPromos } from "@/lib/data/promos";
import { requireMerchant } from "@/lib/session";

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
