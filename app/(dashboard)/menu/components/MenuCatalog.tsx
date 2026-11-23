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

const STATUS_LABELS: Record<MenuStatusFilter, string> = {
  semua: "Semua",
  aktif: "Aktif",
  menipis: "Menipis",
  habis: "Habis",
  nonaktif: "Nonaktif",
};
const ADD_MENU_BUTTON = <LinkButton href="/menu/baru">Tambah menu</LinkButton>;

/** MN-N1…N4, MN-A1/A2, MN-E1, MN-S1…S3. Filter tinggal di URL. */
export function MenuCatalog({
  menus,
  categories,
  loadFailed,
}: {
  menus: MerchantMenu[];
  categories: Category[];
  loadFailed: boolean;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const searchQuery = params.get("q") ?? "";
  const category = params.get("kategori") ?? "";
  const statusParam = params.get("status");
  const status: MenuStatusFilter = MENU_STATUS_FILTERS.find((value) => value === statusParam) ?? "semua";

  const [localMenus, setLocalMenus] = useState<Record<number, MerchantMenu>>({});
  // D13: overlay lokal hanya sampai data server berikutnya tiba (pola useQuota).
  const [seenMenus, setSeenMenus] = useState(menus);
  if (menus !== seenMenus) {
    setSeenMenus(menus);
    setLocalMenus({});
  }
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [pendingDeactivate, setPendingDeactivate] = useState<MerchantMenu | null>(null);

  // Baris dari server disalin utuh (terjual & ditahan ikut berubah).
  const { changeQuotaBy, setQuota, withDraft } = useQuota(
    (menu) => setLocalMenus((previous) => ({ ...previous, [menu.id]: menu })),
    menus,
  );

  // Nilai terbaru untuk timer/handler; state di closure bisa basi saat timer berjalan.
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

  // Back/tautan mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && latest.current.searchInput.trim() !== searchQuery) setSearchInput(searchQuery);
  }, [searchQuery]);

  function navigate(changes: Partial<Record<"q" | "kategori" | "status", string>>) {
    cancelTimer();
    // Perubahan kategori/tab membawa ketikan q yang belum sempat dikirim.
    const nextParams = "q" in changes ? changes : { ...changes, q: latest.current.searchInput.trim() };
    router.replace(buildUrl(path, latest.current.params, nextParams, ["semua"]), { scroll: false });
  }

  // MN-N2: pencarian ke URL setelah 300 ms berhenti mengetik.
  function updateSearch(value: string) {
    setSearchInput(value);
    cancelTimer();
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 300);
  }

  function clearFilters() {
    cancelTimer();
    setSearchInput("");
    router.replace(path, { scroll: false });
  }

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

  const displayedMenus = menus.map((menu) => localMenus[menu.id] ?? menu).map(withDraft);
  const tabCounts = countMenuTabs(filterBySearchAndCategory(displayedMenus, { q: searchQuery, category }));
  const filteredMenus = filterMenus(displayedMenus, { q: searchQuery, category, status });

  async function setActive(menu: MerchantMenu, active: boolean) {
    const setFlag = (value: boolean) =>
      setLocalMenus((previous) => ({ ...previous, [menu.id]: { ...(previous[menu.id] ?? menu), is_active: value } }));
    setFlag(active);
    const result = await callAction(() => setMenuActive(menu.id, active));
    if ("error" in result) {
      setFlag(!active); // MN-E1
      toast({ tone: "danger", message: result.error.message });
      return;
    }
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
