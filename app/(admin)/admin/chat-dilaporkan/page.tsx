// Halaman /admin/chat-dilaporkan: daftar chat pesanan yang dilaporkan pembeli atau penjual. Hanya baca; admin membuka
// satu laporan untuk melihat seluruh riwayat chat-nya. Server component: mengambil GET /admin/chat-reports.
// Semua tingkat admin boleh membuka halaman ini.
import Link from "next/link";
import { Inbox } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatDate, formatTime } from "@/lib/format";
import { LIMIT_CHAT_REPORTS, REPORTER_LABELS, parseReportPage } from "@/services/admin-chat-report.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ChatReportSummary, PageMeta } from "@/types/admin";

/**
 * Halaman daftar chat dilaporkan, terbaru di atas, dengan nomor halaman di URL (?page=).
 * @param props.searchParams parameter URL: `page` (nomor halaman)
 * @returns PageHeader berisi daftar laporan, atau LoadError bila gagal dimuat
 */
export default async function ChatReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Pastikan yang membuka adalah admin (tingkat apa pun), lalu baca nomor halaman.
  await requireAdmin();
  const page = parseReportPage((await searchParams).page);
  // 2. Ambil satu halaman laporan; total ada di `meta`.
  const response = await adminFetch<ChatReportSummary[]>(`/chat-reports?page=${page}&limit=${LIMIT_CHAT_REPORTS}`);
  const rows = response.data;
  const total = (response.meta as PageMeta | undefined)?.total ?? rows?.length ?? 0;

  return (
    <PageHeader
      title="Chat dilaporkan"
      description="Chat pesanan yang dilaporkan pembeli atau penjual. Halaman ini hanya untuk membaca."
    >
      {!response.ok || !rows ? (
        <LoadError
          title="Daftar laporan belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil daftar laporan. Periksa koneksi lalu coba lagi."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Belum ada chat yang dilaporkan"
          body="Laporan dari pembeli atau penjual akan muncul di sini."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {rows.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/admin/chat-dilaporkan/${report.id}`}
                  className="flex min-h-11 flex-col gap-1 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-primary">{report.order_code}</span>
                    <span className="text-sm text-ink-muted">
                      {formatDate(report.created_at)} · {formatTime(report.created_at)}
                    </span>
                  </span>
                  <span className="text-sm text-ink-muted">
                    Dilaporkan {REPORTER_LABELS[report.reporter_role]}: {report.reporter_name}
                  </span>
                  <span className="line-clamp-2 text-ink">{report.reason}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            limit={LIMIT_CHAT_REPORTS}
            hrefFor={(target) => (target > 1 ? `/admin/chat-dilaporkan?page=${target}` : "/admin/chat-dilaporkan")}
          />
        </div>
      )}
    </PageHeader>
  );
}
