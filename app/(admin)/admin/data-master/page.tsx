import { Suspense } from "react";
import { MasterTable } from "@/app/(admin)/admin/components/MasterTable";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { tabDariId } from "@/services/adminMasterService";
import type { ItemMaster } from "@/types/admin";
import { requireAdmin } from "@/services/authService";

// A-01…A-03 — Data master. Tab aktif di URL (?tab=); nilai tak dikenal jatuh ke Kategori.
export default async function DataMasterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const tab = tabDariId((await searchParams).tab);
  const res = await adminFetch<ItemMaster[]>(`/master/${tab.kind}`);
  return (
    <PageHeader title="Data master" description="Kategori menu, titik temu, dan jenis usaha. Data tidak dihapus, hanya dinonaktifkan.">
      {res.ok && res.data ? (
        <Suspense><MasterTable tabId={tab.id} rows={res.data} /></Suspense>
      ) : (
        <GagalMuat judul="Data master belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
      )}
    </PageHeader>
  );
}
