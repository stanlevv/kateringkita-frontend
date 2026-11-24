// Halaman /admin/chat-dilaporkan/<id>: satu laporan chat beserta seluruh riwayat pesannya. Hanya baca, tanpa kotak
// ketik. Server component: mengambil GET /admin/chat-reports/<id>. Id tidak valid atau laporan tidak ada memanggil
// notFound(). Semua tingkat admin boleh membuka halaman ini. Membukanya menandai laporan sudah dibuka di backend, jadi
// RefreshOnOpen memuat ulang layout agar lencana "Chat dilaporkan" di menu ikut berkurang.
import Image from "next/image";
import { notFound } from "next/navigation";
import { LoadError } from "@/app/components/LoadError";
import { RefreshOnOpen } from "@/app/(admin)/admin/components/RefreshOnOpen";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { cx, focusRing } from "@/app/components/ui/cx";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { formatDate, formatTime } from "@/lib/format";
import { DELETED_REPORTER_NAME, REPORTER_LABELS, isValidChatReportId } from "@/services/admin-chat-report.service";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ChatReportDetail } from "@/types/admin";

/**
 * Halaman baca satu laporan chat: siapa melapor, alasannya, lalu semua pesan chat pesanan itu.
 * @param props.params bagian URL dinamis; `id` = nomor laporan
 * @returns PageHeader berisi laporan dan riwayat pesan, atau LoadError bila gagal dimuat
 */
export default async function ChatReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Pastikan admin, lalu tolak id yang bentuknya salah tanpa memanggil backend.
  await requireAdmin();
  const { id } = await params;
  if (!isValidChatReportId(id)) notFound();
  // 2. Ambil laporan; 404 dari backend juga menjadi halaman "tidak ditemukan".
  const response = await adminFetch<ChatReportDetail>(`/chat-reports/${id}`);
  if (response.status === 404) notFound();
  const backLink = (
    <LinkButton href="/admin/chat-dilaporkan" variant="secondary">
      Semua laporan
    </LinkButton>
  );
  // 3. Gagal selain 404: tampilkan pesan galat.
  if (!response.ok || !response.data) {
    return (
      <PageHeader title={`Laporan ${id}`} actions={backLink}>
        <LoadError
          title="Laporan belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil laporan. Periksa koneksi lalu coba lagi."
        />
      </PageHeader>
    );
  }
  // 4. Berhasil: ringkasan laporan, lalu semua pesan (pembeli di kiri, penjual di kanan).
  const report = response.data;
  return (
    <PageHeader title={`Pesanan ${report.order_code}`} actions={backLink}>
      <RefreshOnOpen />
      <div className="flex flex-col gap-4">
        <section aria-label="Laporan" className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">
            Dilaporkan {REPORTER_LABELS[report.reporter_role]}: {report.reporter_name ?? DELETED_REPORTER_NAME} ·{" "}
            {formatDate(report.created_at)} {formatTime(report.created_at)}
          </p>
          <p className="whitespace-pre-wrap break-words text-ink">{report.reason}</p>
        </section>
        {report.messages.length === 0 ? (
          <p className="text-ink-muted">Belum ada pesan di chat ini.</p>
        ) : (
          <ol aria-label="Riwayat chat" className="flex flex-col gap-2 rounded-md border border-line p-3">
            {report.messages.map((message) => {
              const isMerchant = message.sender_role === "merchant";
              const senderLabel = isMerchant ? "Penjual" : "Pembeli";
              return (
                <li
                  key={message.id}
                  className={cx(
                    "flex max-w-[80%] flex-col gap-1",
                    isMerchant ? "self-end items-end" : "self-start items-start",
                  )}
                >
                  <div
                    className={cx(
                      "flex flex-col gap-2 rounded-lg px-3 py-2",
                      isMerchant ? "bg-primary-soft" : "bg-subtle",
                    )}
                  >
                    {message.image_url && (
                      <a href={message.image_url} target="_blank" rel="noopener noreferrer" className={focusRing}>
                        <Image
                          src={message.image_url}
                          alt={`Foto dari ${senderLabel.toLowerCase()}`}
                          width={240}
                          height={240}
                          unoptimized
                          className="h-auto max-h-60 w-auto rounded-md"
                        />
                      </a>
                    )}
                    {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                  </div>
                  <span className="text-xs text-ink-muted">
                    {senderLabel} · {formatDate(message.created_at)} {formatTime(message.created_at)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </PageHeader>
  );
}
