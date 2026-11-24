// Komponen CustomerTable: daftar pembeli di panel admin dengan pencarian, filter status akun, dan halaman.
// Dipakai app/(admin)/admin/pembeli/page.tsx. Pencarian memakai form GET biasa, jadi halaman dimuat ulang dari server.
// "use client": kolom tabel dan tautan halaman berupa fungsi, yang hanya bisa dibuat di komponen klien.
"use client";

import Link from "next/link";
import { Search, SearchX, Users } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input, Select } from "@/app/components/ui/Input";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatDate, formatPhone } from "@/lib/format";
import { buildUrl } from "@/lib/url";
import type { CustomerSummary } from "@/types/admin";

/** Jumlah pembeli per halaman (sama dengan query `limit` yang dikirim halaman). */
export const LIMIT_CUSTOMERS = 20;

const COLUMNS: Column<CustomerSummary>[] = [
  {
    key: "nama",
    header: "Nama",
    cell: (customer) => (
      <Link
        href={`/admin/pembeli/${customer.id}`}
        className="font-semibold text-primary underline-offset-2 hover:underline"
      >
        {customer.full_name}
      </Link>
    ),
  },
  {
    key: "wa",
    header: "Nomor WA",
    cell: (customer) => <span className="font-mono">{formatPhone(customer.phone)}</span>,
  },
  { key: "email", header: "Email", cell: (customer) => customer.email ?? "-" },
  { key: "status", header: "Akun", cell: (customer) => (customer.is_active ? "Aktif" : "Nonaktif") },
  { key: "pesanan", header: "Pesanan", align: "right", cell: (customer) => customer.order_count },
  {
    key: "terakhir",
    header: "Pesanan terakhir",
    cell: (customer) => (customer.last_order_at ? formatDate(customer.last_order_at) : "-"),
  },
];

/**
 * Tabel pembeli dengan pencarian dan filter.
 * @param props.rows   pembeli di halaman ini
 * @param props.page   nomor halaman
 * @param props.total  jumlah semua pembeli yang cocok dengan filter
 * @param props.q      kata kunci pencarian sekarang
 * @param props.status filter status akun sekarang (`active`, `inactive`, atau kosong)
 * @returns form pencarian, tabel atau keadaan kosong, dan navigasi halaman
 */
export function CustomerTable({
  rows,
  page,
  total,
  q,
  status,
}: {
  rows: CustomerSummary[];
  page: number;
  total: number;
  q: string;
  status: string;
}) {
  const filtered = Boolean(q || status);
  const query = new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString();
  return (
    <div className="flex flex-col gap-4">
      <form role="search" method="get" action="/admin/pembeli" className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Cari pembeli"
            placeholder="Cari nama, nomor WA, atau email"
            className="pl-10"
          />
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status akun
          <Select name="status" defaultValue={status} className="md:w-40">
            <option value="">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada pembeli yang cocok"
            body="Coba kata kunci lain atau hapus filter."
            action={
              <LinkButton href="/admin/pembeli" variant="secondary">
                Hapus filter
              </LinkButton>
            }
          />
        ) : (
          <EmptyState icon={Users} title="Belum ada pembeli" body="Pembeli yang mendaftar akan tampil di sini." />
        )
      ) : (
        <DataTable columns={COLUMNS} rows={rows} rowKey={(customer) => String(customer.id)} caption="Daftar pembeli" />
      )}
      <Pagination
        page={page}
        total={total}
        limit={LIMIT_CUSTOMERS}
        hrefFor={(target) => buildUrl("/admin/pembeli", query, { page: String(target) })}
      />
    </div>
  );
}
