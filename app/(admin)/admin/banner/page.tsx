import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { voucherOptions } from "@/lib/voucher-options";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { Banner } from "@/types/banner";
import type { Promo } from "@/types/promo";
import { BannerAdmin } from "./components/BannerAdmin";

// Banner beranda mobile: pengajuan penjual (setujui / tolak) + banner platform. Semua tingkat melihat; super & ops memutuskan.
export default async function BannerAdminPage() {
  const session = await requireAdmin();
  const [banners, promos] = await Promise.all([adminFetch<Banner[]>("/banners"), adminFetch<Promo[]>("/promos")]);
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = promos.ok && promos.data ? voucherOptions(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Banner"
      description="Banner beranda aplikasi pembeli. Pengajuan penjual menunggu persetujuan; banner platform langsung tayang."
    >
      {banners.ok && banners.data ? (
        <BannerAdmin banners={banners.data} vouchers={vouchers} canEdit={session.user.admin_level !== "support"} />
      ) : (
        <LoadError
          title="Banner belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil banner. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
