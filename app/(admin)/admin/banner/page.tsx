// Halaman /admin/banner: banner beranda aplikasi pembeli (mobile). Banner = gambar promosi dengan masa tayang
// (tanggal mulai dan selesai); di luar masa itu banner tidak tampil walau sudah disetujui. Ada dua sumber: pengajuan
// penjual yang menunggu persetujuan admin, dan banner platform yang dibuat admin dan langsung tayang.
// Server component: mengambil banner (GET /admin/banners) dan voucher platform (GET /admin/promos) bersamaan, lalu
// menyerahkannya ke BannerAdmin. Filter ?arsip=1 menampilkan banner yang diarsipkan. Semua tingkat admin melihat; hanya
// super dan ops yang memutuskan, membuat, mengubah, dan mengarsipkan banner.
import { ArchiveFilter } from "@/app/(admin)/admin/components/ArchiveFilter";
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
 * @param props.searchParams parameter URL: `arsip` ("1" = tampilan Arsip)
 * @returns PageHeader berisi BannerAdmin, atau LoadError bila banner gagal dimuat
 */
export default async function BannerAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Pastikan admin, lalu ambil banner (aktif atau arsip, sesuai filter) dan voucher platform bersamaan.
  const session = await requireAdmin();
  const archived = (await searchParams).arsip === "1";
  const [banners, promos] = await Promise.all([
    adminFetch<Banner[]>(archived ? "/banners?archived=true" : "/banners"),
    adminFetch<Promo[]>("/promos"),
  ]);
  // 2. Pilihan voucher: hanya yang aktif, publik, dan belum berakhir saat ini.
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = promos.ok && promos.data ? voucherOptions(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Banner"
      description="Banner beranda aplikasi pembeli. Pengajuan penjual menunggu persetujuan; banner platform langsung tayang."
    >
      <div className="flex flex-col gap-4">
        <ArchiveFilter path="/admin/banner" archived={archived} />
        {banners.ok && banners.data ? (
          <BannerAdmin
            banners={banners.data}
            vouchers={vouchers}
            canEdit={session.user.admin_level !== "support"}
            archived={archived}
          />
        ) : (
          <LoadError
            title="Banner belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil banner. Periksa koneksi lalu coba lagi."
          />
        )}
      </div>
    </PageHeader>
  );
}
