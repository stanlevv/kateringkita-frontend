// Halaman "tiket tidak ditemukan" untuk /admin/tiket/<kode>. Next menampilkan not-found.tsx ini saat page.tsx di
// folder yang sama memanggil notFound() (kode tidak valid atau backend menjawab 404), tetap di dalam kerangka admin.
import { SearchX } from "lucide-react";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";

/**
 * Pesan tiket tidak ditemukan dengan tautan kembali ke daftar tiket.
 * @returns PageHeader berisi EmptyState
 */
export default function TicketNotFound() {
  return (
    <PageHeader title="Tiket tidak ditemukan">
      <EmptyState
        icon={SearchX}
        title="Tiket tidak ditemukan"
        body="Tiket ini tidak ada atau kodenya salah. Periksa kodenya atau kembali ke daftar."
        action={
          <LinkButton href="/admin/tiket" variant="secondary">
            Kembali ke daftar tiket
          </LinkButton>
        }
      />
    </PageHeader>
  );
}
