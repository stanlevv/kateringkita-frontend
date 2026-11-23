// Halaman /admin/admin: kelola akun admin, khusus tingkat super. Server component: mengambil daftar admin lewat
// adminFetch (GET /admin/admins), lalu menyerahkannya ke AdminTable.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AdminAccount } from "@/types/admin";
import { AdminTable } from "./components/AdminTable";

/**
 * Halaman kelola admin. requireAdmin("super") memanggil notFound() untuk tingkat lain, jadi mereka melihat halaman 404
 * (halaman "tidak ditemukan"), bukan pesan "tidak boleh".
 * @returns PageHeader berisi AdminTable, atau LoadError dengan pesan dari backend
 */
export default async function ManageAdminsPage() {
  const { user } = await requireAdmin("super");
  const response = await adminFetch<AdminAccount[]>("/admins");
  return (
    <PageHeader
      title="Kelola admin"
      description="Tambah admin, atur tingkat akses, nonaktifkan, atau reset kata sandi. Semua perubahan tercatat di Log."
    >
      {response.ok && response.data ? (
        <AdminTable rows={response.data} currentAdminId={Number(user.id)} />
      ) : (
        <LoadError
          title="Daftar admin belum bisa dimuat"
          body={response.error?.message ?? "Coba muat ulang halaman."}
        />
      )}
    </PageHeader>
  );
}
