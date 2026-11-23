import { PengumumanForm } from "@/app/(admin)/admin/components/AnnouncementForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireAdmin } from "@/services/auth.service";

// Broadcast pengumuman admin → notifikasi tab Info di aplikasi pembeli/penjual.
export default async function PengumumanPage() {
  await requireAdmin();
  return (
    <PageHeader title="Pengumuman" description="Kirim pengumuman ke notifikasi aplikasi pembeli dan penjual.">
      <PengumumanForm />
    </PageHeader>
  );
}
