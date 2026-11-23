import { Suspense } from "react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LIMIT_TICKETS, parseTicketTab } from "@/services/admin-ticket.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { TicketMeta, TicketSummary } from "@/types/admin";
import { TicketTable } from "./components/TicketTable";

// Tiket bantuan pembeli (semua tingkat admin). Tab status, cari, dan halaman di URL; tanpa ?status = Menunggu.
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = parseTicketTab(params.status);
  const search = params.q?.trim() ?? "";
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  const apiQuery = new URLSearchParams();
  if (tab !== "semua") apiQuery.set("status", tab);
  if (search) apiQuery.set("q", search);
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_TICKETS));
  const response = await adminFetch<TicketSummary[]>(`/tickets?${apiQuery}`);
  const meta = response.meta as TicketMeta | undefined;
  // Dasar "N menit lalu": dihitung sekali per permintaan supaya HTML server dan hidrasi klien sama.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <PageHeader
      title="Tiket bantuan"
      description="Pertanyaan dan keluhan pembeli dari aplikasi. Balasan Anda dikirim ke pembeli sebagai notifikasi."
    >
      {response.ok && response.data ? (
        <Suspense>
          <TicketTable
            rows={response.data}
            tab={tab}
            counts={meta?.counts}
            page={page}
            total={meta?.total ?? response.data.length}
            now={now}
          />
        </Suspense>
      ) : (
        <LoadError
          title="Daftar tiket belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil daftar tiket. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
