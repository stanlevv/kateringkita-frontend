import { notFound } from "next/navigation";
import { LoadError } from "@/app/components/LoadError";
import { PeriodicRefresh } from "@/app/components/PeriodicRefresh";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { isValidTicketCode } from "@/services/admin-ticket.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { TicketDetail } from "@/types/admin";
import { TicketDetailView } from "../components/TicketDetailView";
import { CloseTicketButton } from "../components/CloseTicketButton";

// Detail tiket bantuan: percakapan, balas, tutup. Kode tidak valid atau 404 -> not-found.tsx segmen ini.
export default async function TicketDetailPage({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const { code } = await params;
  if (!isValidTicketCode(code)) notFound();
  const response = await adminFetch<TicketDetail>(`/tickets/${encodeURIComponent(code)}`);
  if (response.status === 404) notFound();
  const backLink = (
    <LinkButton href="/admin/tiket" variant="secondary">
      Semua tiket
    </LinkButton>
  );
  if (!response.ok || !response.data) {
    return (
      <PageHeader title={`Tiket ${code}`} actions={backLink}>
        <LoadError
          title="Tiket belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil tiket. Periksa koneksi lalu coba lagi."
        />
      </PageHeader>
    );
  }
  const ticket = response.data;
  return (
    <PageHeader
      title={ticket.subject}
      actions={
        <>
          {ticket.status !== "closed" && <CloseTicketButton code={ticket.code} />}
          {backLink}
        </>
      }
    >
      {/* balasan pembeli muncul sendiri selama tiket belum ditutup */}
      {ticket.status !== "closed" && <PeriodicRefresh />}
      <TicketDetailView ticket={ticket} />
    </PageHeader>
  );
}
