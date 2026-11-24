// Halaman /admin/pengumuman: kirim pengumuman (broadcast) ke notifikasi aplikasi pembeli dan/atau penjual, tampil di
// tab Info. Server component tanpa data awal; pengiriman dikerjakan AnnouncementForm.
import { AnnouncementForm } from "@/app/(admin)/admin/components/AnnouncementForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman pengumuman. Semua tingkat admin bisa membukanya; backend yang menentukan siapa boleh mengirim.
 * @returns PageHeader berisi AnnouncementForm
 */
export default async function AnnouncementsPage() {
  await requireAdmin();
  return (
    <PageHeader title="Pengumuman" description="Kirim pengumuman ke notifikasi aplikasi pembeli dan penjual.">
      <AnnouncementForm />
    </PageHeader>
  );
}
