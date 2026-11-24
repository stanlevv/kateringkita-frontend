// Halaman /banner: penjual mengajukan banner tokonya untuk beranda aplikasi pembeli, melihat status dan alasan
// penolakan admin, lalu mengajukan ulang. Server component: mengambil banner (GET /merchant/banners) dan promo toko
// (untuk pilihan voucher tujuan banner) dari backend.
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LoadError } from "@/app/components/LoadError";
import { voucherOptions } from "@/lib/voucher-options";
import { merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getPromos } from "@/services/promo.service";
import type { Banner } from "@/types/banner";
import { MerchantBanners } from "./components/MerchantBanners";

/**
 * Halaman banner toko.
 * @returns PageHeader berisi MerchantBanners, atau LoadError bila banner gagal dimuat
 */
export default async function BannerPage() {
  await requireMerchant();
  const [banners, promos] = await Promise.all([merchantFetch<Banner[]>("/banners"), getPromos()]);
  // Hanya voucher yang belum berakhir saat halaman dimuat yang bisa dipilih sebagai tujuan banner.
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = "data" in promos ? voucherOptions(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Banner"
      description="Pasang banner tokomu di beranda aplikasi pembeli. Tampil setelah disetujui admin."
    >
      {banners.ok && banners.data ? (
        <MerchantBanners banners={banners.data} vouchers={vouchers} />
      ) : (
        <LoadError
          title="Banner belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil banner. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
