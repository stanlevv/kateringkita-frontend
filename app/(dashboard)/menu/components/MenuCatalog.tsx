// Komponen MenuCatalog: isi halaman /menu (cari, kategori, tab status, kartu menu, nonaktifkan/aktifkan, kuota).
// Data berasal dari page.tsx. Filter disimpan di URL (?q=&kategori=&status=) sehingga bisa dibagikan dan Back bekerja.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, UtensilsCrossed } from "lucide-react";
import { setMenuActive } from "@/app/actions/menus";
import { callAction } from "@/lib/action";
import { LoadError } from "@/app/components/LoadError";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { Tabs } from "@/app/components/ui/Tabs";
import { toast } from "@/app/components/ui/Toast";
import { LinkButton } from "@/app/components/ui/LinkButton";
import {
  countMenuTabs,
  filterMenus,
  filterBySearchAndCategory,
  MENU_STATUS_FILTERS,
  type MenuStatusFilter,
} from "@/lib/menu-filter";
import type { Category } from "@/types/meta";
import type { MerchantMenu } from "@/types/menu";
import { buildUrl } from "@/lib/url";
import { MenuCard } from "./MenuCard";
import { useQuota } from "@/hooks/useQuota";

/** Label tab status; kuncinya juga nilai `?status=` di URL. */
const STATUS_LABELS: Record<MenuStatusFilter, string> = {
  semua: "Semua",
  aktif: "Aktif",
  menipis: "Menipis",
  habis: "Habis",
  nonaktif: "Nonaktif",
};
const ADD_MENU_BUTTON = <LinkButton href="/menu/baru">Tambah menu</LinkButton>;

/**
 * Katalog menu dengan pencarian, filter kategori, dan tab status. Perubahan aktif/nonaktif dan kuota langsung tampil
 * (optimistis) dan dibatalkan bila server menolak.
 * @param props.menus daftar menu dari server
 * @param props.categories daftar kategori untuk filter
 * @param props.loadFailed pengambilan data di server gagal
 * @returns layar gagal muat, keadaan belum ada menu, atau katalog
 */
export function MenuCatalog({
  menus,
  categories,
  loadFailed,
}: {
  menus: MerchantMenu[];
  categories: Category[];
  loadFailed: boolean;
}) {
  // 1. Baca filter dari URL (useSearchParams = parameter URL di klien).
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const searchQuery = params.get("q") ?? "";
  const category = params.get("kategori") ?? "";
  const statusParam = params.get("status");
  const status: MenuStatusFilter = MENU_STATUS_FILTERS.find((value) => value === statusParam) ?? "semua";

  const [localMenus, setLocalMenus] = useState<Record<number, MerchantMenu>>({});
  // 2. Salinan lokal menu yang baru diubah. Salinan ini hanya berlaku sampai data server berikutnya tiba (pola yang
  // sama dengan useQuota), supaya data server yang lebih baru tidak tertimpa.
  const [seenMenus, setSeenMenus] = useState(menus);
  if (menus !== seenMenus) {
    setSeenMenus(menus);
    setLocalMenus({});
  }
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [pendingDeactivate, setPendingDeactivate] = useState<MerchantMenu | null>(null);

  // 3. Kuota lewat useQuota. Menu hasil simpan dari server disalin utuh (terjual dan ditahan ikut berubah).
  const { changeQuotaBy, setQuota, withDraft } = useQuota(
    (menu) => setLocalMenus((previous) => ({ ...previous, [menu.id]: menu })),
    menus,
  );

  // 4. Nilai terbaru untuk timer dan handler: state yang tertangkap di closure (fungsi yang dibuat saat render lama)
  // bisa basi saat timer berjalan, jadi dibaca dari ref.
  const latest = useRef({ params: params.toString(), searchInput });
  useEffect(() => {
    latest.current = { params: params.toString(), searchInput };
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelTimer = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => cancelTimer, []);

  // 5. Back/tautan mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && latest.current.searchInput.trim() !== searchQuery) setSearchInput(searchQuery);
  }, [searchQuery]);

  /** Menulis perubahan filter ke URL; tab "semua" dihapus dari URL karena itu nilai bawaan. */
  function navigate(changes: Partial<Record<"q" | "kategori" | "status", string>>) {
    cancelTimer();
    // Perubahan kategori/tab membawa ketikan q yang belum sempat dikirim.
    const nextParams = "q" in changes ? changes : { ...changes, q: latest.current.searchInput.trim() };
    router.replace(buildUrl(path, latest.current.params, nextParams, ["semua"]), { scroll: false });
  }

  /** Kotak cari: URL baru diperbarui 300 ms setelah pengguna berhenti mengetik (debounce). */
  function updateSearch(value: string) {
    setSearchInput(value);
    cancelTimer();
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 300);
  }

  /** Menghapus semua filter dan isi kotak cari. */
  function clearFilters() {
    cancelTimer();
    setSearchInput("");
    router.replace(path, { scroll: false });
  }

  // 6. Gagal muat atau belum ada menu sama sekali.
  if (loadFailed)
    return (
      <LoadError
        title="Menu belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil daftar menu. Periksa koneksi lalu coba lagi."
      />
    );
  if (menus.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Belum ada menu"
        body="Belum ada menu. Tambahkan menu pertama agar pembeli bisa memesan."
        action={ADD_MENU_BUTTON}
      />
    );
  }

  // 7. Menu yang ditampilkan = data server + salinan lokal + draf kuota, lalu disaring.
  const displayedMenus = menus.map((menu) => localMenus[menu.id] ?? menu).map(withDraft);
  const tabCounts = countMenuTabs(filterBySearchAndCategory(displayedMenus, { q: searchQuery, category }));
  const filteredMenus = filterMenus(displayedMenus, { q: searchQuery, category, status });

  /** Mengaktifkan/menonaktifkan menu secara optimistis; gagal dikembalikan, nonaktif sukses bisa dibatalkan. */
  async function setActive(menu: MerchantMenu, active: boolean) {
    // 1. Ubah tampilan dulu, lalu kirim ke server.
    const setFlag = (value: boolean) =>
      setLocalMenus((previous) => ({ ...previous, [menu.id]: { ...(previous[menu.id] ?? menu), is_active: value } }));
    setFlag(active);
    const result = await callAction(() => setMenuActive(menu.id, active));
    if ("error" in result) {
      // 2. Gagal: kembalikan tampilan dan tampilkan pesan server.
      setFlag(!active);
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    // 3. Berhasil: toast; untuk nonaktif ada tombol Batalkan yang mengaktifkan lagi.
    toast(
      active
        ? { tone: "success", message: "Menu diaktifkan" }
        : {
            tone: "success",
            message: "Menu dinonaktifkan",
            action: { label: "Batalkan", onClick: () => void setActive(menu, true) },
          },
    );
  }

  // 8. Pesan keadaan kosong sesuai filter yang dipakai.
  const categoryName = categories.find((candidate) => candidate.slug === category)?.name ?? category;
  const emptyMessage = searchQuery
    ? `Tidak ada menu yang cocok dengan "${searchQuery}"`
    : category
      ? `Tidak ada menu di kategori "${categoryName}"`
      : `Tidak ada menu dengan status "${STATUS_LABELS[status]}"`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
          />
          <Input
            type="search"
            aria-label="Cari menu"
            placeholder="Cari nama menu"
            value={searchInput}
            onChange={(event) => updateSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          aria-label="Kategori"
          value={category}
          onChange={(event) => navigate({ kategori: event.target.value })}
          className="sm:w-56"
        >
          <option value="">Semua kategori</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption.id} value={categoryOption.slug}>
              {categoryOption.name}
            </option>
          ))}
        </Select>
      </div>
      <Tabs
        label="Status menu"
        value={status}
        onChange={(id) => navigate({ status: id })}
        tabs={MENU_STATUS_FILTERS.map((id) => ({ id, label: STATUS_LABELS[id], count: tabCounts[id] }))}
      />
      {filteredMenus.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Menu tidak ditemukan"
          body={emptyMessage}
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Hapus filter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onQuotaChange={(quota) => setQuota(menu.id, quota)}
              onDelta={(delta) => changeQuotaBy(menu.id, delta)}
              onDeactivate={() => setPendingDeactivate(menu)}
              onActivate={() => void setActive(menu, true)}
            />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        tone="danger"
        title="Nonaktifkan menu?"
        body="Menu disembunyikan dari pembeli. Pesanan lama tetap tercatat."
        confirmLabel="Nonaktifkan menu"
        onConfirm={() => {
          const menu = pendingDeactivate!;
          setPendingDeactivate(null);
          void setActive(menu, false);
        }}
      />
    </div>
  );
}
