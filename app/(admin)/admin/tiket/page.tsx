// Halaman /admin/tiket: daftar tiket bantuan dari pembeli. Tiket bantuan = pertanyaan atau keluhan yang pembeli kirim
// dari aplikasi; admin membalas di halaman detail dan balasannya sampai ke pembeli sebagai notifikasi.
// Server component (berjalan di server, tanpa "use client"): membaca searchParams (?status=&q=&page=, parameter di URL
// setelah tanda tanya), mengambil satu halaman tiket dari backend (GET /admin/tickets), lalu menyerahkannya ke
// TicketTable.
// Semua tingkat admin (super, ops, support) boleh membuka halaman ini.
import { Suspense } from "react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LIMIT_TICKETS, parseTicketTab } from "@/services/admin-ticket.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { TicketMeta, TicketSummary } from "@/types/admin";
import { TicketTable } from "./components/TicketTable";

/**
 * Halaman daftar tiket bantuan. Tab status, kata cari, dan nomor halaman ada di URL, jadi bisa dibagikan dan tetap ada
 * saat dimuat ulang. Tanpa ?status yang tampil tab Menunggu. TicketTable dibungkus Suspense karena membaca
 * useSearchParams di peramban.
 * @param props.searchParams parameter URL: `status` (open, answered, closed, atau semua), `q` (kata cari), `page`
 * @returns PageHeader berisi TicketTable, atau LoadError bila daftar gagal dimuat
 */
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Pastikan yang membuka adalah admin (tingkat apa pun), lalu baca parameter URL.
  await requireAdmin();
  const params = await searchParams;
  // 2. Saring nilai URL: tab yang tidak dikenal menjadi "open", kata cari dirapikan dari spasi.
  const tab = parseTicketTab(params.status);
  const search = params.q?.trim() ?? "";
  // 3. Nomor halaman harus bilangan bulat 1–100.000; selain itu dianggap halaman 1.
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 4. Susun query ke backend. Tab "semua" berarti tanpa penyaring status.
  const apiQuery = new URLSearchParams();
  if (tab !== "semua") apiQuery.set("status", tab);
  if (search) apiQuery.set("q", search);
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_TICKETS));
  // 5. Ambil satu halaman tiket; total dan jumlah per tab (counts) ada di `meta`.
  const response = await adminFetch<TicketSummary[]>(`/tickets?${apiQuery}`);
  const meta = response.meta as TicketMeta | undefined;
  // 6. Dasar "N menit lalu": dihitung sekali per permintaan supaya HTML server dan hidrasi klien sama.
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
