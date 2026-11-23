"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Search, SearchX } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { Pagination } from "@/app/components/ui/Pagination";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { formatTime, formatRupiah, todayWib } from "@/lib/format";
import { LIMIT_ORDERS, summarizeItems, STATUS_FILTER } from "@/lib/order-filter";
import { buildUrl } from "@/lib/url";
import type { MerchantOrder } from "@/types/order";

const detailHref = (order: MerchantOrder) => `/pesanan/${encodeURIComponent(order.code)}`;

const COLUMNS: Column<MerchantOrder>[] = [
  {
    key: "kode",
    header: "Kode",
    cell: (order) => (
      <Link
        href={detailHref(order)}
        className="font-mono font-semibold text-primary underline-offset-2 hover:underline"
      >
        {order.code}
      </Link>
    ),
  },
  { key: "waktu", header: "Waktu", cell: (order) => <span className="font-mono">{formatTime(order.created_at)}</span> },
  { key: "pemesan", header: "Pemesan", cell: (order) => order.customer_name },
  {
    key: "item",
    header: "Item",
    cell: (order) => <span className="block max-w-64 truncate">{summarizeItems(order)}</span>,
  },
  { key: "total", header: "Total", align: "right", cell: (order) => formatRupiah(order.total) },
  {
    key: "bayar",
    header: "Pembayaran",
    cell: (order) => <PaymentBadge method={order.payment_method} status={order.payment_status} />,
  },
  { key: "status", header: "Status", cell: (order) => <StatusBadge order={order} /> },
];

/** PS-N1, PS-N3, PS-S1. Filter, pencarian, dan halaman tinggal di URL dan diproses server; mengubah filter mengembalikan ke halaman 1. */
export function OrderTable({ rows, total, loadFailed }: { rows: MerchantOrder[]; total: number; loadFailed: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [today] = useState(todayWib);

  const search = params.get("q") ?? "";
  const status = STATUS_FILTER.find((filter) => filter.id === params.get("status"))?.id;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get("tanggal") ?? "") ? params.get("tanggal")! : today;
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  const urlWith = (changes: Record<string, string>) => buildUrl(path, params.toString(), changes);
  const navigate = (changes: Record<string, string>) =>
    router.replace(urlWith({ ...changes, page: "" }), { scroll: false });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim() });
  }

  if (loadFailed)
    return (
      <LoadError
        title="Pesanan belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil daftar pesanan. Periksa koneksi lalu coba lagi."
      />
    );

  const isFiltered = !!status || !!search || date !== today;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <form role="search" onSubmit={submitSearch} className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
          />
          <Input
            key={search}
            name="q"
            type="search"
            aria-label="Cari kode atau nama"
            placeholder="Cari kode atau nama pemesan"
            defaultValue={search}
            className="pl-10"
            onChange={(event) => {
              if (event.target.value === "" && search) navigate({ q: "" });
            }}
          />
        </form>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Tanggal
          <Input
            type="date"
            value={date}
            onChange={(event) => navigate({ tanggal: event.target.value })}
            className="md:w-44"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <Select
            value={status ?? ""}
            onChange={(event) => navigate({ status: event.target.value })}
            className="md:w-48"
          >
            <option value="">Semua</option>
            {STATUS_FILTER.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {total === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={SearchX}
            title="Pesanan tidak ditemukan"
            body="Tidak ada pesanan yang cocok dengan filter ini."
            action={
              <Button variant="secondary" onClick={() => router.replace(path, { scroll: false })}>
                Hapus filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="Belum ada pesanan hari ini"
            body="Pesanan baru akan muncul di sini begitu pembeli memesan."
          />
        )
      ) : (
        <>
          {/* Tabel mulai 1024 px (tujuh kolom tidak muat di tablet); di bawahnya kartu bertumpuk dengan data yang sama, tanpa geser mendatar. */}
          <div className="hidden lg:block">
            <DataTable
              caption="Daftar pesanan"
              columns={COLUMNS}
              rows={rows}
              rowKey={(order) => order.code}
              onRowClick={(order) => router.push(detailHref(order))}
            />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((order) => (
              <li key={order.code}>
                <Link
                  href={detailHref(order)}
                  className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-ink">{order.code}</span>
                    <span className="font-mono text-sm text-ink-muted">{formatTime(order.created_at)}</span>
                  </span>
                  <span className="text-ink">{order.customer_name}</span>
                  <span className="text-sm text-ink-muted">{summarizeItems(order)}</span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge order={order} />
                    <span className="font-mono font-semibold text-ink">{formatRupiah(order.total)}</span>
                  </span>
                  <PaymentBadge method={order.payment_method} status={order.payment_status} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            limit={LIMIT_ORDERS}
            hrefFor={(pageNumber) => urlWith({ page: pageNumber > 1 ? String(pageNumber) : "" })}
          />
        </>
      )}
    </div>
  );
}
