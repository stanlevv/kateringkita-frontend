// Komponen MerchantTable: daftar penjual di /admin/penjual dengan kotak cari, filter status, filter dapur, dan
// paginasi. Semua filter disimpan di URL; halaman server membaca URL itu lalu mengambil data dari backend.
// "use client": berjalan di peramban (client component) karena memakai state, timer, router, dan membaca URL.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, Store } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";

import { LIMIT_MERCHANTS, VERIFICATION_STATUSES } from "@/services/admin-merchant.service";
import type { MerchantSummary } from "@/types/admin";
import { formatPhone } from "@/lib/format";
import { buildUrl } from "@/lib/url";
import { VerificationBadge } from "./VerificationBadge";

// Alamat detail penjual dan label status dapur.
const detailHref = (merchant: MerchantSummary) => `/admin/penjual/${merchant.id}`;
const openLabel = (merchant: MerchantSummary) => (merchant.is_open ? "Buka" : "Tutup");

// Kolom tabel layar lebar. Di layar sempit daftar tampil sebagai kartu.
const COLUMNS: Column<MerchantSummary>[] = [
  {
    key: "toko",
    header: "Toko",
    cell: (merchant) => (
      <Link href={detailHref(merchant)} className="font-semibold text-primary underline-offset-2 hover:underline">
        {merchant.business_name}
      </Link>
    ),
  },
  { key: "pemilik", header: "Pemilik", cell: (merchant) => merchant.owner_name },
  {
    key: "wa",
    header: "WhatsApp",
    cell: (merchant) => <span className="font-mono">{formatPhone(merchant.wa_number)}</span>,
  },
  { key: "status", header: "Status", cell: (merchant) => <VerificationBadge status={merchant.verification_status} /> },
  { key: "buka", header: "Dapur", cell: openLabel },
  { key: "menu", header: "Menu aktif", align: "right", cell: (merchant) => merchant.menu_count },
];

/**
 * Daftar penjual. Pencarian dikirim ke URL setelah jeda mengetik 400 ms (debounce), filter lain langsung; mengubah
 * filter kembali ke halaman 1.
 * @param props.rows penjual satu halaman
 * @param props.page nomor halaman sekarang
 * @param props.total jumlah semua penjual yang cocok
 * @param props.filtered true bila ada filter aktif (mengubah pesan saat kosong)
 * @returns kotak cari dan filter, lalu tabel (layar lebar) atau kartu, dan paginasi
 */
export function MerchantTable({
  rows,
  page,
  total,
  filtered,
}: {
  rows: MerchantSummary[];
  page: number;
  total: number;
  filtered: boolean;
}) {
  // 1. Kata cari di URL dan isi kotak cari (bisa berbeda selama pengguna masih mengetik).
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [searchText, setSearchText] = useState(query);
  // 2. Nilai terbaru untuk timer; state di dalam closure bisa basi (nilai lama) saat timer berjalan.
  const latest = useRef({ params: params.toString(), searchText });
  useEffect(() => {
    latest.current = { params: params.toString(), searchText };
  });
  // 3. Timer jeda mengetik; dibatalkan saat komponen dilepas.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelTimer = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => cancelTimer, []);

  // 4. Tautan, tombol Back, atau Hapus filter mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && latest.current.searchText.trim() !== query) setSearchText(query);
  }, [query]);

  // 5. Ganti URL dengan filter baru (halaman kembali ke 1), ketik ke kotak cari, dan hapus semua filter.
  function navigate(changes: Record<string, string>) {
    cancelTimer();
    // Filter lain membawa ketikan q yang belum sempat dikirim.
    const allChanges = "q" in changes ? changes : { ...changes, q: latest.current.searchText.trim() };
    router.replace(buildUrl(path, latest.current.params, { ...allChanges, page: "" }), { scroll: false });
  }

  function typeSearch(value: string) {
    setSearchText(value);
    cancelTimer();
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 400);
  }

  function clearFilters() {
    cancelTimer();
    setSearchText("");
    router.replace(path, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
          />
          <Input
            type="search"
            aria-label="Cari toko atau WhatsApp"
            placeholder="Cari nama toko atau nomor WhatsApp"
            value={searchText}
            onChange={(event) => typeSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <Select
            value={params.get("status") ?? ""}
            onChange={(event) => navigate({ status: event.target.value })}
            className="md:w-48"
          >
            <option value="">Semua</option>
            {Object.entries(VERIFICATION_STATUSES).map(([status, view]) => (
              <option key={status} value={status}>
                {view.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Dapur
          <Select
            value={params.get("open") ?? ""}
            onChange={(event) => navigate({ open: event.target.value })}
            className="md:w-40"
          >
            <option value="">Semua</option>
            <option value="1">Buka</option>
            <option value="0">Tutup</option>
          </Select>
        </label>
      </div>

      {rows.length === 0 ? (
        filtered || page > 1 ? (
          <EmptyState
            icon={SearchX}
            title="Penjual tidak ditemukan"
            body="Tidak ada penjual yang cocok dengan filter ini."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Hapus filter
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Store} title="Belum ada penjual" body="Penjual yang mendaftar akan muncul di sini." />
        )
      ) : (
        <>
          <div className="hidden lg:block">
            <DataTable
              caption="Daftar penjual"
              columns={COLUMNS}
              rows={rows}
              rowKey={(merchant) => String(merchant.id)}
              onRowClick={(merchant) => router.push(detailHref(merchant))}
            />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((merchant) => (
              <li key={merchant.id}>
                <Link
                  href={detailHref(merchant)}
                  className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="font-semibold text-ink">{merchant.business_name}</span>
                  <span className="text-sm text-ink-muted">
                    {merchant.owner_name} · {formatPhone(merchant.wa_number)}
                  </span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <VerificationBadge status={merchant.verification_status} />
                    <span className="text-sm text-ink-muted">
                      Dapur {openLabel(merchant).toLowerCase()} · {merchant.menu_count} menu aktif
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            limit={LIMIT_MERCHANTS}
            hrefFor={(pageNumber) => buildUrl(path, params.toString(), { page: String(pageNumber) }, ["1"])}
          />
        </>
      )}
    </div>
  );
}
