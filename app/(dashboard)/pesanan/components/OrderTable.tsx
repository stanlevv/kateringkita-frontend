"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Search, SearchX } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { Pagination } from "@/app/components/ui/Pagination";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { formatJam, formatRupiah, hariIniWib } from "@/lib/format";
import { LIMIT_PESANAN, ringkasItem, STATUS_FILTER } from "@/lib/order-filter";
import { urlDengan } from "@/lib/url";
import type { MerchantOrder } from "@/types/order";

const detail = (o: MerchantOrder) => `/pesanan/${encodeURIComponent(o.code)}`;

const KOLOM: Column<MerchantOrder>[] = [
  { key: "kode", header: "Kode", cell: (o) => <Link href={detail(o)} className="font-mono font-semibold text-primary underline-offset-2 hover:underline">{o.code}</Link> },
  { key: "waktu", header: "Waktu", cell: (o) => <span className="font-mono">{formatJam(o.created_at)}</span> },
  { key: "pemesan", header: "Pemesan", cell: (o) => o.customer_name },
  { key: "item", header: "Item", cell: (o) => <span className="block max-w-64 truncate">{ringkasItem(o)}</span> },
  { key: "total", header: "Total", align: "right", cell: (o) => formatRupiah(o.total) },
  { key: "bayar", header: "Pembayaran", cell: (o) => <PaymentBadge method={o.payment_method} status={o.payment_status} /> },
  { key: "status", header: "Status", cell: (o) => <StatusBadge order={o} /> },
];

/** PS-N1, PS-N3, PS-S1. Filter, pencarian, dan halaman tinggal di URL dan diproses server; mengubah filter mengembalikan ke halaman 1. */
export function OrderTable({ rows, total, galat }: { rows: MerchantOrder[]; total: number; galat: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [hariIni] = useState(hariIniWib);

  const q = params.get("q") ?? "";
  const status = STATUS_FILTER.find((s) => s.id === params.get("status"))?.id;
  const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(params.get("tanggal") ?? "") ? params.get("tanggal")! : hariIni;
  const halaman = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  const url = (ubahan: Record<string, string>) => urlDengan(path, params.toString(), ubahan);
  const ke = (ubahan: Record<string, string>) => router.replace(url({ ...ubahan, page: "" }), { scroll: false });

  function cari(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ke({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
  }

  if (galat) return <GagalMuat judul="Pesanan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil daftar pesanan. Periksa koneksi lalu coba lagi." />;

  const tersaring = !!status || !!q || tanggal !== hariIni;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <form role="search" onSubmit={cari} className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
          <Input key={q} name="q" type="search" aria-label="Cari kode atau nama" placeholder="Cari kode atau nama pemesan" defaultValue={q} className="pl-10"
            onChange={(e) => { if (e.target.value === "" && q) ke({ q: "" }); }} />
        </form>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">Tanggal
          <Input type="date" value={tanggal} onChange={(e) => ke({ tanggal: e.target.value })} className="md:w-44" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">Status
          <Select value={status ?? ""} onChange={(e) => ke({ status: e.target.value })} className="md:w-48">
            <option value="">Semua</option>
            {STATUS_FILTER.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </label>
      </div>

      {total === 0 ? (
        tersaring ? (
          <EmptyState icon={SearchX} title="Pesanan tidak ditemukan" body="Tidak ada pesanan yang cocok dengan filter ini."
            action={<Button variant="secondary" onClick={() => router.replace(path, { scroll: false })}>Hapus filter</Button>} />
        ) : (
          <EmptyState icon={Inbox} title="Belum ada pesanan hari ini" body="Pesanan baru akan muncul di sini begitu pembeli memesan." />
        )
      ) : (
        <>
          {/* Tabel mulai 1024 px (tujuh kolom tidak muat di tablet); di bawahnya kartu bertumpuk dengan data yang sama, tanpa geser mendatar. */}
          <div className="hidden lg:block">
            <DataTable caption="Daftar pesanan" columns={KOLOM} rows={rows} rowKey={(o) => o.code} onRowClick={(o) => router.push(detail(o))} />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((o) => (
              <li key={o.code}>
                <Link href={detail(o)} className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-ink">{o.code}</span>
                    <span className="font-mono text-sm text-ink-muted">{formatJam(o.created_at)}</span>
                  </span>
                  <span className="text-ink">{o.customer_name}</span>
                  <span className="text-sm text-ink-muted">{ringkasItem(o)}</span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge order={o} />
                    <span className="font-mono font-semibold text-ink">{formatRupiah(o.total)}</span>
                  </span>
                  <PaymentBadge method={o.payment_method} status={o.payment_status} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={halaman} total={total} limit={LIMIT_PESANAN} hrefFor={(p) => url({ page: p > 1 ? String(p) : "" })} />
        </>
      )}
    </div>
  );
}
