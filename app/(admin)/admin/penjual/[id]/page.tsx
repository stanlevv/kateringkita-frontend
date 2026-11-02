import { SearchX } from "lucide-react";
import { MerchantDetail } from "@/components/admin/MerchantDetail";
import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { adminFetch } from "@/lib/admin/api";
import type { DetailPenjual } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/session";

// A-05 — Detail penjual.
export default async function PenjualDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const tidakAda = (
    <EmptyState icon={SearchX} title="Penjual tidak ditemukan" body="Penjual ini tidak ada atau sudah dihapus."
      action={<LinkButton href="/admin/penjual" variant="secondary">Kembali ke daftar penjual</LinkButton>} />
  );
  if (!/^[1-9]\d{0,9}$/.test(id)) return tidakAda;
  const res = await adminFetch<DetailPenjual>(`/merchants/${id}`);
  if (res.status === 404) return tidakAda;
  if (!res.ok || !res.data) return <GagalMuat judul="Penjual belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data penjual. Periksa koneksi lalu coba lagi." />;
  return (
    <PageHeader title={res.data.business_name} actions={<LinkButton href="/admin/penjual" variant="secondary">Semua penjual</LinkButton>}>
      <MerchantDetail m={res.data} />
    </PageHeader>
  );
}
