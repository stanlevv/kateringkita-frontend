// Halaman /admin/data-master: data master, yaitu daftar pilihan yang dipakai penjual (kategori menu, titik temu, jenis
// usaha). Server component: membaca searchParams (?tab=) lalu mengambil data tab itu lewat adminFetch
// (GET /admin/master/<jenis>) dan menyerahkannya ke MasterTable. searchParams = parameter di URL setelah tanda tanya.
import { Suspense } from "react";
import { MasterTable } from "@/app/(admin)/admin/components/MasterTable";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { tabById } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman data master. Tab aktif ada di URL (?tab=); nilai yang tidak dikenal jatuh ke tab Kategori. MasterTable
 * dibungkus Suspense karena membaca useSearchParams di peramban.
 * @param props.searchParams parameter URL: `tab` (id tab, mis. "titik-temu")
 * @returns PageHeader berisi MasterTable, atau LoadError bila data gagal dimuat
 */
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
