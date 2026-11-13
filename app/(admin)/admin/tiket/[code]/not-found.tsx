import { SearchX } from "lucide-react";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";

// notFound() dari page.tsx segmen ini (kode tidak valid atau backend 404): tetap di dalam shell admin.
export default function TiketTidakDitemukan() {
  return (
    <PageHeader title="Tiket tidak ditemukan">
      <EmptyState icon={SearchX} title="Tiket tidak ditemukan" body="Tiket ini tidak ada atau kodenya salah. Periksa kodenya atau kembali ke daftar."
        action={<LinkButton href="/admin/tiket" variant="secondary">Kembali ke daftar tiket</LinkButton>} />
    </PageHeader>
  );
}
