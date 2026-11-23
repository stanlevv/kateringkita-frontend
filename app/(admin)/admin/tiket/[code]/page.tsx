// Halaman /admin/tiket/<kode>: detail satu tiket bantuan, yaitu percakapan pembeli dengan admin, formulir balas, dan
// tombol tutup tiket. Server component: mengambil tiket dari backend (GET /admin/tickets/<kode>) lalu menyerahkannya ke
// TicketDetailView. Kode tidak valid atau tiket tidak ada memanggil notFound(), yaitu fungsi Next yang menghentikan
// halaman dan menampilkan not-found.tsx di folder ini. Semua tingkat admin boleh membuka halaman ini.
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

/**
 * Halaman detail tiket bantuan. Selama tiket belum ditutup, PeriodicRefresh memuat ulang data tiap beberapa detik agar
 * balasan baru dari pembeli muncul sendiri.
 * @param props.params bagian URL dinamis; `code` = kode tiket, mis. TK-20261113-7QPX
 * @returns PageHeader berisi TicketDetailView, atau LoadError bila tiket gagal dimuat
 */
export default async function TicketDetailPage({ params }: { params: Promise<{ code: string }> }) {
  // 1. Pastikan admin, lalu tolak kode yang bentuknya salah tanpa memanggil backend.
  await requireAdmin();
  const { code } = await params;
  if (!isValidTicketCode(code)) notFound();
  // 2. Ambil tiket; 404 dari backend juga menjadi halaman "tidak ditemukan".
  const response = await adminFetch<TicketDetail>(`/tickets/${encodeURIComponent(code)}`);
  if (response.status === 404) notFound();
  // 3. Tautan kembali ke daftar dipakai di kedua tampilan (gagal dan berhasil).
  const backLink = (
    <LinkButton href="/admin/tiket" variant="secondary">
      Semua tiket
    </LinkButton>
  );
  // 4. Gagal selain 404: tampilkan pesan dengan tombol coba lagi.
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
  // 5. Berhasil: tombol tutup hanya untuk tiket yang belum ditutup.
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
