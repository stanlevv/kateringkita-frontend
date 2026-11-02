import { simpanPromoPlatform, setAktifPromoPlatform } from "@/app/actions/admin/promos";
import { ServiceFeeForm } from "@/components/admin/ServiceFeeForm";
import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { PromoList } from "@/components/promo/PromoList";
import { PageHeader } from "@/components/shell/PageHeader";
import { adminFetch } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/session";
import type { Promo } from "@/lib/types";

// A-02…A-04 — Promo platform dan biaya layanan.
export default async function PromoPlatformPage() {
  await requireAdmin();
  const [promos, biaya] = await Promise.all([adminFetch<Promo[]>("/promos"), adminFetch<{ service_fee: number }>("/settings")]);
  return (
    <PageHeader title="Promo & biaya" description="Promo yang berlaku di semua toko dan biaya layanan per pesanan.">
      <div className="flex flex-col gap-8">
        {biaya.ok && biaya.data ? (
          <ServiceFeeForm nilai={biaya.data.service_fee} />
        ) : (
          <GagalMuat judul="Biaya layanan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil biaya layanan. Periksa koneksi lalu coba lagi." />
        )}
        <PromoList admin promos={promos.ok && promos.data ? promos.data : []} galat={!promos.ok}
          simpan={simpanPromoPlatform} setAktifAksi={setAktifPromoPlatform} />
      </div>
    </PageHeader>
  );
}
