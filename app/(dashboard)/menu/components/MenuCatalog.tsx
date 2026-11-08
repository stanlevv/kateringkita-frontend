"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, UtensilsCrossed } from "lucide-react";
import { setMenuActive } from "@/app/actions/menus";
import { panggil } from "@/lib/aksi";
import { GagalMuat } from "@/app/components/GagalMuat";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { Tabs } from "@/app/components/ui/Tabs";
import { toast } from "@/app/components/ui/Toast";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { hitungTab, saring, saringQK, STATUS_MENU, type StatusMenu } from "@/lib/menu-filter";
import type { Category } from "@/types/meta";
import type { MerchantMenu } from "@/types/menu";
import { urlDengan } from "@/lib/url";
import { MenuCard } from "./MenuCard";
import { useKuota } from "@/hooks/useKuota";

const LABEL: Record<StatusMenu, string> = { semua: "Semua", aktif: "Aktif", menipis: "Menipis", habis: "Habis", nonaktif: "Nonaktif" };
const TAMBAH = <LinkButton href="/menu/baru">Tambah menu</LinkButton>;

/** MN-N1…N4, MN-A1/A2, MN-E1, MN-S1…S3. Filter tinggal di URL. */
export function MenuCatalog({ menus, categories, galat }: { menus: MerchantMenu[]; categories: Category[]; galat: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const kategori = params.get("kategori") ?? "";
  const s = params.get("status");
  const status: StatusMenu = STATUS_MENU.find((x) => x === s) ?? "semua";

  const [lokal, setLokal] = useState<Record<number, MerchantMenu>>({});
  // D13: overlay lokal hanya sampai data server berikutnya tiba (pola useKuota).
  const [dariMenus, setDariMenus] = useState(menus);
  if (menus !== dariMenus) {
    setDariMenus(menus);
    setLokal({});
  }
  const [qInput, setQInput] = useState(q);
  const [konfirmasi, setKonfirmasi] = useState<MerchantMenu | null>(null);

  // Baris dari server disalin utuh (terjual & ditahan ikut berubah).
  const { ubahDelta, ubahMutlak, dengan } = useKuota((m) => setLokal((l) => ({ ...l, [m.id]: m })), menus);

  // Nilai terbaru untuk timer/handler; state di closure bisa basi saat timer berjalan.
  const terbaru = useRef({ params: params.toString(), qInput });
  useEffect(() => { terbaru.current = { params: params.toString(), qInput }; });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const batalkanTimer = () => { clearTimeout(timer.current); timer.current = undefined; };
  useEffect(() => batalkanTimer, []);

  // Back/tautan mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && terbaru.current.qInput.trim() !== q) setQInput(q);
  }, [q]);

  function ke(ubahan: Partial<Record<"q" | "kategori" | "status", string>>) {
    batalkanTimer();
    // Perubahan kategori/tab membawa ketikan q yang belum sempat dikirim.
    const semua = "q" in ubahan ? ubahan : { ...ubahan, q: terbaru.current.qInput.trim() };
    router.replace(urlDengan(path, terbaru.current.params, semua, ["semua"]), { scroll: false });
  }

  // MN-N2: pencarian ke URL setelah 300 ms berhenti mengetik.
  function ketik(v: string) {
    setQInput(v);
    batalkanTimer();
    timer.current = setTimeout(() => ke({ q: v.trim() }), 300);
  }

  function hapusFilter() {
    batalkanTimer();
    setQInput("");
    router.replace(path, { scroll: false });
  }

  if (galat) return <GagalMuat judul="Menu belum bisa dimuat" isi="Terjadi kesalahan saat mengambil daftar menu. Periksa koneksi lalu coba lagi." />;
  if (menus.length === 0) {
    return <EmptyState icon={UtensilsCrossed} title="Belum ada menu" body="Belum ada menu. Tambahkan menu pertama agar pembeli bisa memesan." action={TAMBAH} />;
  }

  const daftar = menus.map((m) => lokal[m.id] ?? m).map(dengan);
  const tab = hitungTab(saringQK(daftar, { q, kategori }));
  const hasil = saring(daftar, { q, kategori, status });

  async function setAktif(m: MerchantMenu, aktif: boolean) {
    const setFlag = (v: boolean) => setLokal((l) => ({ ...l, [m.id]: { ...(l[m.id] ?? m), is_active: v } }));
    setFlag(aktif);
    const r = await panggil(() => setMenuActive(m.id, aktif));
    if ("error" in r) {
      setFlag(!aktif); // MN-E1
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    toast(aktif
      ? { tone: "success", message: "Menu diaktifkan" }
      : { tone: "success", message: "Menu dinonaktifkan", action: { label: "Batalkan", onClick: () => void setAktif(m, true) } });
  }

  const namaKategori = categories.find((c) => c.slug === kategori)?.name ?? kategori;
  const kosong = q ? `Tidak ada menu yang cocok dengan "${q}"` : kategori ? `Tidak ada menu di kategori "${namaKategori}"` : `Tidak ada menu dengan status "${LABEL[status]}"`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
          <Input type="search" aria-label="Cari menu" placeholder="Cari nama menu" value={qInput} onChange={(e) => ketik(e.target.value)} className="pl-10" />
        </div>
        <Select aria-label="Kategori" value={kategori} onChange={(e) => ke({ kategori: e.target.value })} className="sm:w-56">
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </Select>
      </div>
      <Tabs label="Status menu" value={status} onChange={(id) => ke({ status: id })}
        tabs={STATUS_MENU.map((id) => ({ id, label: LABEL[id], count: tab[id] }))} />
      {hasil.length === 0 ? (
        <EmptyState icon={SearchX} title="Menu tidak ditemukan" body={kosong}
          action={<Button variant="secondary" onClick={hapusFilter}>Hapus filter</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hasil.map((m) => (
            <MenuCard key={m.id} menu={m} onKuota={(n) => ubahMutlak(m.id, n)} onDelta={(d) => ubahDelta(m.id, d)} onNonaktif={() => setKonfirmasi(m)} onAktif={() => void setAktif(m, true)} />
          ))}
        </div>
      )}
      <ConfirmDialog open={!!konfirmasi} onClose={() => setKonfirmasi(null)} tone="danger" title="Nonaktifkan menu?"
        body="Menu disembunyikan dari pembeli. Pesanan lama tetap tercatat." confirmLabel="Nonaktifkan menu"
        onConfirm={() => { const m = konfirmasi!; setKonfirmasi(null); void setAktif(m, false); }} />
    </div>
  );
}
