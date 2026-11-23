import { notFound } from "next/navigation";
import { LoadError } from "@/app/components/LoadError";
import { PeriodicRefresh } from "@/app/components/PeriodicRefresh";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { isValidTicketCode } from "@/services/admin-ticket.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { TicketDetail } from "@/types/admin";
import { TiketDetail } from "../components/TiketDetail";
import { TutupTiket } from "../components/TutupTiket";

// Detail tiket bantuan: percakapan, balas, tutup. Kode tidak valid atau 404 -> not-found.tsx segmen ini.
export default async function TiketDetailPage({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const { code } = await params;
  if (!isValidTicketCode(code)) notFound();
  const res = await adminFetch<TicketDetail>(`/tickets/${encodeURIComponent(code)}`);
  if (res.status === 404) notFound();
  const kembali = (
    <LinkButton href="/admin/tiket" variant="secondary">
      Semua tiket
    </LinkButton>
  );
  if (!res.ok || !res.data) {
    return (
      <PageHeader title={`Tiket ${code}`} actions={kembali}>
        <LoadError
          title="Tiket belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil tiket. Periksa koneksi lalu coba lagi."
        />
      </PageHeader>
    );
  }
  const t = res.data;
  return (
    <PageHeader
      title={t.subject}
      actions={
        <>
          {t.status !== "closed" && <TutupTiket code={t.code} />}
          {kembali}
        </>
      }
    >
      {/* balasan pembeli muncul sendiri selama tiket belum ditutup */}
      {t.status !== "closed" && <PeriodicRefresh />}
      <TiketDetail t={t} />
    </PageHeader>
  );
}
