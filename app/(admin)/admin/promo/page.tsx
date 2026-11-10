import { simpanPromoPlatform, setAktifPromoPlatform } from "@/app/actions/admin/promos";
import { ServiceFeeForm } from "@/app/(admin)/admin/components/ServiceFeeForm";
import { CsContactForm } from "@/app/(admin)/admin/components/CsContactForm";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PromoList } from "@/app/components/promo/PromoList";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { Promo } from "@/types/promo";

// A-02…A-04 — Promo platform, biaya layanan, dan kontak CS.
export default async function PromoPlatformPage() {
  const { user } = await requireAdmin();
  const bolehSetelan = user.admin_level === "super"; // Fase 1: ubah biaya & kontak CS khusus super
  const [promos, biaya] = await Promise.all([adminFetch<Promo[]>("/promos"), adminFetch<{ service_fee: number; cs_whatsapp: string | null }>("/settings")]);
  return (
    <PageHeader title="Promo & biaya" description="Promo yang berlaku di semua toko dan biaya layanan per pesanan.">
      <div className="flex flex-col gap-8">
        {!bolehSetelan ? null : biaya.ok && biaya.data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ServiceFeeForm nilai={biaya.data.service_fee} />
            <CsContactForm nilai={biaya.data.cs_whatsapp ?? ""} />
          </div>
        ) : (
          <GagalMuat judul="Biaya layanan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil biaya layanan. Periksa koneksi lalu coba lagi." />
        )}
        <PromoList admin promos={promos.ok && promos.data ? promos.data : []} galat={!promos.ok}
          simpan={simpanPromoPlatform} setAktifAksi={setAktifPromoPlatform} />
      </div>
    </PageHeader>
  );
}
