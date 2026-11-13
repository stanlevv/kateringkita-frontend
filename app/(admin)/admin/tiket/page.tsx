import { Suspense } from "react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LIMIT_TIKET, tabTiket } from "@/services/adminTiketService";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { MetaTiket, TiketRingkas } from "@/types/admin";
import { TiketTable } from "./components/TiketTable";

// Tiket bantuan pembeli (semua tingkat admin). Tab status, cari, dan halaman di URL; tanpa ?status = Menunggu.
export default async function TiketPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = tabTiket(sp.status);
  const cari = sp.q?.trim() ?? "";
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  const q = new URLSearchParams();
  if (tab !== "semua") q.set("status", tab);
  if (cari) q.set("q", cari);
  q.set("page", String(page));
  q.set("limit", String(LIMIT_TIKET));
  const res = await adminFetch<TiketRingkas[]>(`/tickets?${q}`);
  const meta = res.meta as MetaTiket | undefined;
  // Dasar "N menit lalu": dihitung sekali per permintaan supaya HTML server dan hidrasi klien sama.
  // eslint-disable-next-line react-hooks/purity
  const sekarang = Date.now();

  return (
    <PageHeader title="Tiket bantuan" description="Pertanyaan dan keluhan pembeli dari aplikasi. Balasan Anda dikirim ke pembeli sebagai notifikasi.">
      {res.ok && res.data ? (
        <Suspense>
          <TiketTable rows={res.data} tab={tab} counts={meta?.counts} page={page} total={meta?.total ?? res.data.length} sekarang={sekarang} />
        </Suspense>
      ) : (
        <GagalMuat judul="Daftar tiket belum bisa dimuat" isi="Terjadi kesalahan saat mengambil daftar tiket. Periksa koneksi lalu coba lagi." />
      )}
    </PageHeader>
  );
}
