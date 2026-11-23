import { Suspense } from "react";
import { MasterTable } from "@/app/(admin)/admin/components/MasterTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { tabById } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

// A-01…A-03 — Data master. Tab aktif di URL (?tab=); nilai tak dikenal jatuh ke Kategori.
export default async function MasterDataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const tab = tabById((await searchParams).tab);
  const response = await adminFetch<MasterItem[]>(`/master/${tab.kind}`);
  return (
    <PageHeader
      title="Data master"
      description="Kategori menu, titik temu, dan jenis usaha. Data tidak dihapus, hanya dinonaktifkan."
    >
      {response.ok && response.data ? (
        <Suspense>
          <MasterTable tabId={tab.id} rows={response.data} />
        </Suspense>
      ) : (
        <LoadError
          title="Data master belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
