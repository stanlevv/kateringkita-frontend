import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { pilihanVoucher } from "@/lib/pilihan-voucher";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { Banner } from "@/types/banner";
import type { Promo } from "@/types/promo";
import { BannerAdmin } from "./components/BannerAdmin";

// Banner beranda mobile: pengajuan penjual (setujui / tolak) + banner platform. Semua tingkat melihat; super & ops memutuskan.
export default async function BannerAdminPage() {
  const session = await requireAdmin();
  const [banners, promos] = await Promise.all([adminFetch<Banner[]>("/banners"), adminFetch<Promo[]>("/promos")]);
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = promos.ok && promos.data ? pilihanVoucher(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Banner"
      description="Banner beranda aplikasi pembeli. Pengajuan penjual menunggu persetujuan; banner platform langsung tayang."
    >
      {banners.ok && banners.data ? (
        <BannerAdmin banners={banners.data} vouchers={vouchers} bolehUbah={session.user.admin_level !== "support"} />
      ) : (
        <GagalMuat
          judul="Banner belum bisa dimuat"
          isi="Terjadi kesalahan saat mengambil banner. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
