import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { AkunAdmin } from "@/types/admin";
import { AdminTable } from "./components/AdminTable";

// Fase 1: kelola akun admin (khusus super). Tingkat lain mendapat 404.
export default async function KelolaAdminPage() {
  const { user } = await requireAdmin("super");
  const res = await adminFetch<AkunAdmin[]>("/admins");
  return (
    <PageHeader title="Kelola admin" description="Tambah admin, atur tingkat akses, nonaktifkan, atau reset kata sandi. Semua perubahan tercatat di Log.">
      {res.ok && res.data ? <AdminTable rows={res.data} sayaId={Number(user.id)} /> : <GagalMuat judul="Daftar admin belum bisa dimuat" isi={res.error?.message ?? "Coba muat ulang halaman."} />}
    </PageHeader>
  );
}
