// Halaman /admin/akun: data akun admin yang sedang masuk dan formulir ganti kata sandi.
// Server component: data akun diambil dari sesi (requireAdmin), tanpa memanggil backend lagi.
import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LEVEL_LABELS, type AdminLevel } from "@/lib/admin-level";
import { requireAdmin } from "@/services/auth.service";

/**
 * Halaman akun admin. Hanya kata sandi yang bisa diganti di sini. Panel web belum punya tempat untuk mengubah nama dan
 * nomor admin yang sudah ada; halaman kelola admin (/admin/admin) hanya bisa membuat admin baru, mengubah tingkat,
 * menonaktifkan/mengaktifkan, dan membuat sandi sementara.
 * @returns PageHeader berisi data akun (nama, nomor HP, tingkat) dan ChangePasswordForm
 */
export default async function AdminAccountPage() {
  const { user } = await requireAdmin();
  const level = LEVEL_LABELS[user.admin_level as AdminLevel] ?? "-";
  return (
    <PageHeader title="Pengaturan akun" description="Ganti kata sandi akun admin Anda.">
      <div className="flex flex-col gap-6">
        <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-muted">Nama</dt>
          <dd className="font-semibold">{String(user.full_name ?? "")}</dd>
          <dt className="text-ink-muted">Nomor HP</dt>
          <dd>{String(user.phone ?? "")}</dd>
          <dt className="text-ink-muted">Tingkat</dt>
          <dd>{level}</dd>
        </dl>
        <ChangePasswordForm />
      </div>
    </PageHeader>
  );
}
