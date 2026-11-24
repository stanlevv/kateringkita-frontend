// Halaman "laporan tidak ditemukan" untuk /admin/chat-dilaporkan/<id>, tampil saat page.tsx memanggil notFound().
import { SearchX } from "lucide-react";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";

/**
 * Pesan laporan tidak ditemukan dengan tautan kembali ke daftar.
 * @returns PageHeader berisi EmptyState
 */
export default function ChatReportNotFound() {
  return (
    <PageHeader title="Laporan tidak ditemukan">
      <EmptyState
        icon={SearchX}
        title="Laporan tidak ditemukan"
        body="Laporan ini tidak ada atau nomornya salah. Kembali ke daftar untuk memilih lagi."
        action={
          <LinkButton href="/admin/chat-dilaporkan" variant="secondary">
            Kembali ke daftar laporan
          </LinkButton>
        }
      />
    </PageHeader>
  );
}
