import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LEVEL_LABELS, type AdminLevel } from "@/lib/admin-level";
import { requireAdmin } from "@/services/auth.service";

// Fase 1: akun admin sendiri (ganti sandi). Nama/nomor diubah oleh admin super lain bila perlu.
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
