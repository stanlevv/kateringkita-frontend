// Halaman /admin/promo: promo platform (berlaku di semua toko), biaya layanan per pesanan, kontak CS, dan mode
// pemeliharaan. Server component: mengambil promo (GET /admin/promos) dan setelan (GET /admin/settings) lewat
// adminFetch secara bersamaan. Mode pemeliharaan = saklar yang menutup aplikasi untuk penjual dan pembeli sementara.
// Filter ?arsip=1 menampilkan promo platform yang diarsipkan.
import { savePlatformPromo, setPlatformPromoActive, setPlatformPromoArchived } from "@/app/actions/admin/promos";
import { ArchiveFilter } from "@/app/(admin)/admin/components/ArchiveFilter";
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
 * daftar promo platform tampil untuk semua tingkat, tetapi hanya super dan ops yang mengubah dan mengarsipkannya.
 * @param props.searchParams parameter URL: `arsip` ("1" = tampilan Arsip)
 * @returns PageHeader berisi formulir setelan (khusus super) dan PromoList mode admin
 */
export default async function PromoPlatformPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user } = await requireAdmin();
  const canEditSettings = user.admin_level === "super"; // ubah biaya, kontak CS, dan pemeliharaan khusus super
  const archived = (await searchParams).arsip === "1";
  const [promos, settings] = await Promise.all([
    adminFetch<Promo[]>(archived ? "/promos?archived=true" : "/promos"),
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
        <div className="flex flex-col gap-4">
          <ArchiveFilter path="/admin/promo" archived={archived} />
          {/* key per filter: Link tidak me-remount halaman yang sama, jadi state lokal PromoList tidak boleh terbawa */}
          <PromoList
            key={archived ? "arsip" : "aktif"}
            admin
            promos={promos.ok && promos.data ? promos.data : []}
            loadFailed={!promos.ok}
            saveAction={savePlatformPromo}
            setActiveAction={setPlatformPromoActive}
            archiveAction={setPlatformPromoArchived}
            archived={archived}
            canEdit={user.admin_level !== "support"}
          />
        </div>
      </div>
    </PageHeader>
  );
}
