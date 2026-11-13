import { notFound } from "next/navigation";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { kodeTiketValid } from "@/services/adminTiketService";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { DetailTiket } from "@/types/admin";
import { TiketDetail } from "../components/TiketDetail";
import { TutupTiket } from "../components/TutupTiket";

// Detail tiket bantuan: percakapan, balas, tutup. Kode tidak valid atau 404 -> not-found.tsx segmen ini.
export default async function TiketDetailPage({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const { code } = await params;
  if (!kodeTiketValid(code)) notFound();
  const res = await adminFetch<DetailTiket>(`/tickets/${encodeURIComponent(code)}`);
  if (res.status === 404) notFound();
  const kembali = <LinkButton href="/admin/tiket" variant="secondary">Semua tiket</LinkButton>;
  if (!res.ok || !res.data) {
    return (
      <PageHeader title={`Tiket ${code}`} actions={kembali}>
        <GagalMuat judul="Tiket belum bisa dimuat" isi="Terjadi kesalahan saat mengambil tiket. Periksa koneksi lalu coba lagi." />
      </PageHeader>
    );
  }
  const t = res.data;
  return (
    <PageHeader title={t.subject} actions={<>{t.status !== "closed" && <TutupTiket code={t.code} />}{kembali}</>}>
      <TiketDetail t={t} />
    </PageHeader>
  );
}
