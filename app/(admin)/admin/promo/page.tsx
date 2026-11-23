// Halaman /admin/promo: promo platform (berlaku di semua toko), biaya layanan per pesanan, kontak CS, dan mode
// pemeliharaan. Server component: mengambil promo (GET /admin/promos) dan setelan (GET /admin/settings) lewat
// adminFetch secara bersamaan. Mode pemeliharaan = saklar yang menutup aplikasi untuk penjual dan pembeli sementara.
import { savePlatformPromo, setPlatformPromoActive } from "@/app/actions/admin/promos";
import { ServiceFeeForm } from "@/app/(admin)/admin/components/ServiceFeeForm";
import { CustomerServiceContactForm } from "@/app/(admin)/admin/components/CustomerServiceContactForm";
import { MaintenanceForm } from "@/app/(admin)/admin/components/MaintenanceForm";
import { LoadError } from "@/app/components/LoadError";
import { PromoList } from "@/app/components/promo/PromoList";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { Promo } from "@/types/promo";
import type { Maintenance } from "@/types/meta";

/**
 * Halaman promo dan biaya. Formulir setelan (biaya layanan, kontak CS, pemeliharaan) hanya tampil untuk admin super;
 * daftar promo platform tampil untuk semua tingkat.
 * @returns PageHeader berisi formulir setelan (khusus super) dan PromoList mode admin
 */
export default async function PromoPlatformPage() {
  const { user } = await requireAdmin();
  const canEditSettings = user.admin_level === "super"; // ubah biaya, kontak CS, dan pemeliharaan khusus super
  const [promos, settings] = await Promise.all([
    adminFetch<Promo[]>("/promos"),
    adminFetch<{ service_fee: number; cs_whatsapp: string | null; maintenance: Maintenance }>("/settings"),
  ]);
  return (
    <PageHeader title="Promo & biaya" description="Promo yang berlaku di semua toko dan biaya layanan per pesanan.">
      <div className="flex flex-col gap-8">
        {!canEditSettings ? null : settings.ok && settings.data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ServiceFeeForm currentFee={settings.data.service_fee} />
            <CustomerServiceContactForm value={settings.data.cs_whatsapp ?? ""} />
            <MaintenanceForm maintenance={settings.data.maintenance ?? { aktif: false, pesan: null }} />
          </div>
        ) : (
          <LoadError
            title="Biaya layanan belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil biaya layanan. Periksa koneksi lalu coba lagi."
          />
        )}
        <PromoList
          admin
          promos={promos.ok && promos.data ? promos.data : []}
          loadFailed={!promos.ok}
          saveAction={savePlatformPromo}
          setActiveAction={setPlatformPromoActive}
        />
      </div>
    </PageHeader>
  );
}
