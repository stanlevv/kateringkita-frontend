import { VerificationQueue } from "@/app/(admin)/admin/components/VerificationQueue";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import type { VerificationQueueItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

// A-05 — Antrean verifikasi penjual.
export default async function VerificationPage() {
  await requireAdmin();
  const response = await adminFetch<VerificationQueueItem[]>("/verification-queue");
  return (
    <PageHeader
      title="Verifikasi penjual"
      description="Periksa toko baru atau yang sudah diperbaiki. Yang paling lama menunggu ada di atas."
    >
      {response.ok && response.data ? (
        <VerificationQueue rows={response.data} />
      ) : (
        <LoadError
          title="Antrean belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil antrean. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
