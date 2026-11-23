// Halaman /admin/popup: pop-up promo yang muncul saat aplikasi pembeli (mobile) dibuka. Pop-up punya masa tayang
// (mulai dan selesai, WIB); di dalam masa itu pop-up aktif terbaru tampil sekali sehari per pembeli dan berhenti
// setelah vouchernya diklaim. Server component: mengambil pop-up (GET /admin/popups) dan voucher platform
// (GET /admin/promos) bersamaan, lalu menyerahkannya ke PopupList. Semua tingkat admin melihat; super dan ops mengatur.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { voucherOptions } from "@/lib/voucher-options";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { Popup } from "@/types/popup";
import type { Promo } from "@/types/promo";
import { PopupList } from "./components/PopupList";

/**
 * Halaman pop-up admin. Gagal memuat voucher tidak menggagalkan halaman (pilihan voucher kosong saja).
 * @returns PageHeader berisi PopupList, atau LoadError bila pop-up gagal dimuat
 */
export default async function PopupPage() {
  const session = await requireAdmin();
  // GET /admin/promos = promo platform saja (voucher pop-up harus voucher platform)
  const [popups, promos] = await Promise.all([adminFetch<Popup[]>("/popups"), adminFetch<Promo[]>("/promos")]);
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = promos.ok && promos.data ? voucherOptions(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Pop-up"
      description="Pop-up promo saat aplikasi pembeli dibuka. Tampil sekali sehari dan berhenti setelah vouchernya diklaim."
    >
      {popups.ok && popups.data ? (
        <PopupList popups={popups.data} vouchers={vouchers} canEdit={session.user.admin_level !== "support"} />
      ) : (
        <LoadError
          title="Pop-up belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil pop-up. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
