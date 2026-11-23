import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { pilihanVoucher } from "@/lib/pilihan-voucher";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { Popup } from "@/types/popup";
import type { Promo } from "@/types/promo";
import { DaftarPopup } from "./components/DaftarPopup";

// Pop-up promo aplikasi mobile (rancangan voucher 2026-11-16 §5.5): semua tingkat melihat; super & ops mengatur.
export default async function PopupPage() {
  const session = await requireAdmin();
  // GET /admin/promos = promo platform saja (voucher pop-up harus voucher platform)
  const [popups, promos] = await Promise.all([adminFetch<Popup[]>("/popups"), adminFetch<Promo[]>("/promos")]);
  // eslint-disable-next-line react-hooks/purity -- daftar voucher yang belum berakhir saat halaman dimuat
  const vouchers = promos.ok && promos.data ? pilihanVoucher(promos.data, Date.now()) : [];
  return (
    <PageHeader
      title="Pop-up"
      description="Pop-up promo saat aplikasi pembeli dibuka. Tampil sekali sehari dan berhenti setelah vouchernya diklaim."
    >
      {popups.ok && popups.data ? (
        <DaftarPopup popups={popups.data} vouchers={vouchers} bolehUbah={session.user.admin_level !== "support"} />
      ) : (
        <GagalMuat
          judul="Pop-up belum bisa dimuat"
          isi="Terjadi kesalahan saat mengambil pop-up. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
