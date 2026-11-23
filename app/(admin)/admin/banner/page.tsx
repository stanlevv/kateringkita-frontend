// Halaman /admin/banner: banner beranda aplikasi pembeli (mobile). Banner = gambar promosi dengan masa tayang
// (tanggal mulai dan selesai); di luar masa itu banner tidak tampil walau sudah disetujui. Ada dua sumber: pengajuan
// penjual yang menunggu persetujuan admin, dan banner platform yang dibuat admin dan langsung tayang.
// Server component: mengambil banner (GET /admin/banners) dan voucher platform (GET /admin/promos) bersamaan, lalu
// menyerahkannya ke BannerAdmin. Semua tingkat admin melihat; hanya super dan ops yang memutuskan dan membuat banner.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { voucherOptions } from "@/lib/voucher-options";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { Banner } from "@/types/banner";
import type { Promo } from "@/types/promo";
import { BannerAdmin } from "./components/BannerAdmin";

/**
 * Halaman banner admin. Voucher dipakai sebagai pilihan tujuan banner platform; gagal memuat voucher tidak menggagalkan
 * halaman (pilihannya kosong saja).
 * @returns PageHeader berisi BannerAdmin, atau LoadError bila banner gagal dimuat
 */
export default async function BannerAdminPage() {
  // 1. Pastikan admin, lalu ambil banner dan voucher platform bersamaan.
  const session = await requireAdmin();
  const [banners, promos] = await Promise.all([adminFetch<Banner[]>("/banners"), adminFetch<Promo[]>("/promos")]);
  // 2. Pilihan voucher: hanya yang aktif, publik, dan belum berakhir saat ini.
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
