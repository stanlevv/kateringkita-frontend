import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { voucherOptions } from "@/lib/voucher-options";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { Popup } from "@/types/popup";
import type { Promo } from "@/types/promo";
import { PopupList } from "./components/PopupList";

// Pop-up promo aplikasi mobile (rancangan voucher 2026-11-16 §5.5): semua tingkat melihat; super & ops mengatur.
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
