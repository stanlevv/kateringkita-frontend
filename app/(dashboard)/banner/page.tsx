import { PageHeader } from "@/app/components/shell/PageHeader";
import { GagalMuat } from "@/app/components/GagalMuat";
import { voucherOptions } from "@/lib/voucher-options";
import { merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getPromos } from "@/services/promo.service";
import type { Banner } from "@/types/banner";
import { BannerToko } from "./components/BannerToko";

// Banner beranda toko (rancangan voucher 2026-11-16 §5.4): ajukan, lihat status & alasan, ajukan ulang.
export default async function BannerPage() {
  await requireMerchant();
  const [banners, promos] = await Promise.all([merchantFetch<Banner[]>("/banners"), getPromos()]);
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = "data" in promos ? voucherOptions(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Banner"
      description="Pasang banner tokomu di beranda aplikasi pembeli. Tampil setelah disetujui admin."
    >
      {banners.ok && banners.data ? (
        <BannerToko banners={banners.data} vouchers={vouchers} />
      ) : (
        <GagalMuat
          judul="Banner belum bisa dimuat"
          isi="Terjadi kesalahan saat mengambil banner. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
