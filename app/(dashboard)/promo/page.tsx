// Halaman /promo: daftar voucher toko (promo toko) dengan buat, ubah, aktif/nonaktif, dan hapus. Voucher = kode
// potongan harga yang diketik pembeli saat checkout. Server component: mengambil promo dari backend lewat
// services/promo.service.ts (GET /merchant/promos); perubahan dikerjakan PromoList lewat server action.
import { PromoList } from "@/app/components/promo/PromoList";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPromos } from "@/services/promo.service";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman promo toko.
 * @returns PageHeader berisi PromoList (menampilkan galat sendiri bila data gagal dimuat)
 */
export default async function PromoPage() {
  await requireMerchant();
  const promos = await getPromos();
  return (
    <PageHeader title="Promo">
      <PromoList promos={"data" in promos ? promos.data : []} loadFailed={"error" in promos} />
    </PageHeader>
  );
}
