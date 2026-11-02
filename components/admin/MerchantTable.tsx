"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";

import { LIMIT_PENJUAL, STATUS_VERIFIKASI } from "@/lib/admin/merchants";
import type { PenjualRingkas } from "@/lib/admin/types";
import { formatTelepon } from "@/lib/format";
import { urlDengan } from "@/lib/url";
import { StatusVerifikasi } from "./StatusVerifikasi";

const detail = (m: PenjualRingkas) => `/admin/penjual/${m.id}`;
const buka = (m: PenjualRingkas) => (m.is_open ? "Buka" : "Tutup");

const KOLOM: Column<PenjualRingkas>[] = [
  { key: "toko", header: "Toko", cell: (m) => <Link href={detail(m)} className="font-semibold text-primary underline-offset-2 hover:underline">{m.business_name}</Link> },
  { key: "pemilik", header: "Pemilik", cell: (m) => m.owner_name },
  { key: "wa", header: "WhatsApp", cell: (m) => <span className="font-mono">{formatTelepon(m.wa_number)}</span> },
  { key: "status", header: "Status", cell: (m) => <StatusVerifikasi status={m.verification_status} /> },
  { key: "buka", header: "Dapur", cell: buka },
  { key: "menu", header: "Menu aktif", align: "right", cell: (m) => m.menu_count },
];

/** A-05 — daftar penjual. Pencarian (ditunda), filter, dan halaman tinggal di URL. */
export function MerchantTable({ rows, page, total, tersaring }: { rows: PenjualRingkas[]; page: number; total: number; tersaring: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [teks, setTeks] = useState(q);
  // Nilai terbaru untuk timer; state di closure bisa basi saat timer berjalan.
  const terbaru = useRef({ params: params.toString(), teks });
  useEffect(() => { terbaru.current = { params: params.toString(), teks }; });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const batalkanTimer = () => { clearTimeout(timer.current); timer.current = undefined; };
  useEffect(() => batalkanTimer, []);

  // Tautan/Back/Hapus filter mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && terbaru.current.teks.trim() !== q) setTeks(q);
  }, [q]);

  function ke(ubahan: Record<string, string>) {
    batalkanTimer();
    // Filter lain membawa ketikan q yang belum sempat dikirim.
    const semua = "q" in ubahan ? ubahan : { ...ubahan, q: terbaru.current.teks.trim() };
    router.replace(urlDengan(path, terbaru.current.params, { ...semua, page: "" }), { scroll: false });
  }

  function ketik(v: string) {
    setTeks(v);
    batalkanTimer();
    timer.current = setTimeout(() => ke({ q: v.trim() }), 400);
  }

  function hapusFilter() {
    batalkanTimer();
    setTeks("");
    router.replace(path, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
          <Input type="search" aria-label="Cari toko atau WhatsApp" placeholder="Cari nama toko atau nomor WhatsApp" value={teks} onChange={(e) => ketik(e.target.value)} className="pl-10" />
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">Status
          <Select value={params.get("status") ?? ""} onChange={(e) => ke({ status: e.target.value })} className="md:w-48">
            <option value="">Semua</option>
            {Object.entries(STATUS_VERIFIKASI).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">Dapur
          <Select value={params.get("open") ?? ""} onChange={(e) => ke({ open: e.target.value })} className="md:w-40">
            <option value="">Semua</option>
            <option value="1">Buka</option>
            <option value="0">Tutup</option>
          </Select>
        </label>
      </div>

      {rows.length === 0 ? (
        tersaring || page > 1 ? (
          <EmptyState icon={SearchX} title="Penjual tidak ditemukan" body="Tidak ada penjual yang cocok dengan filter ini."
            action={<Button variant="secondary" onClick={hapusFilter}>Hapus filter</Button>} />
        ) : (
          <EmptyState icon={Store} title="Belum ada penjual" body="Penjual yang mendaftar akan muncul di sini." />
        )
      ) : (
        <>
          <div className="hidden lg:block">
            <DataTable caption="Daftar penjual" columns={KOLOM} rows={rows} rowKey={(m) => String(m.id)} onRowClick={(m) => router.push(detail(m))} />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((m) => (
              <li key={m.id}>
                <Link href={detail(m)} className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus">
                  <span className="font-semibold text-ink">{m.business_name}</span>
                  <span className="text-sm text-ink-muted">{m.owner_name} · {formatTelepon(m.wa_number)}</span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <StatusVerifikasi status={m.verification_status} />
                    <span className="text-sm text-ink-muted">Dapur {buka(m).toLowerCase()} · {m.menu_count} menu aktif</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={total} limit={LIMIT_PENJUAL} hrefFor={(p) => urlDengan(path, params.toString(), { page: String(p) }, ["1"])} />
        </>
      )}
    </div>
  );
}
