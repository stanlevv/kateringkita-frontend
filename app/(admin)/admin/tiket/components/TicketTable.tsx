"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Search, SearchX } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Input } from "@/app/components/ui/Input";
import { Pagination } from "@/app/components/ui/Pagination";
import { Tabs } from "@/app/components/ui/Tabs";
import { formatPhone } from "@/lib/format";
import { buildUrl } from "@/lib/url";
import {
  SENDER_LABELS,
  LIMIT_TICKETS,
  TICKET_TABS,
  categoryLabel,
  type TicketTab,
} from "@/services/admin-ticket.service";
import type { TicketMeta, TicketSummary } from "@/types/admin";
import { TicketStatusBadge, RelativeTime } from "./TicketStatusBadge";

const ticketHref = (ticket: TicketSummary) => `/admin/tiket/${encodeURIComponent(ticket.code)}`;

const EMPTY_MESSAGES: Record<TicketTab, { title: string; body: string }> = {
  open: {
    title: "Tidak ada tiket yang menunggu",
    body: "Semua tiket sudah dibalas. Tiket baru dari pembeli akan muncul di sini.",
  },
  answered: {
    title: "Tidak ada tiket yang menunggu pembeli",
    body: "Tiket yang sudah dibalas admin dan belum ditutup akan muncul di sini.",
  },
  closed: { title: "Belum ada tiket yang ditutup", body: "Tiket yang ditutup admin atau pembeli akan muncul di sini." },
  semua: { title: "Belum ada tiket", body: "Tiket bantuan dari pembeli akan muncul di sini." },
};

function buildColumns(tab: TicketTab, now: number): Column<TicketSummary>[] {
  const columns: Column<TicketSummary>[] = [
    {
      key: "kode",
      header: "Tiket",
      cell: (ticket) => (
        <Link
          href={ticketHref(ticket)}
          className="font-mono font-semibold text-primary underline-offset-2 hover:underline"
        >
          {ticket.code}
        </Link>
      ),
    },
    {
      key: "judul",
      header: "Judul",
      wrap: true,
      cell: (ticket) => (
        <span className="flex flex-col">
          <span className="font-medium">{ticket.subject}</span>
          <span className="text-ink-muted">{categoryLabel(ticket.category)}</span>
          {ticket.last_message_preview && (
            <span className="line-clamp-1 text-ink-muted">{ticket.last_message_preview}</span>
          )}
        </span>
      ),
    },
    {
      key: "pembeli",
      header: "Pembeli",
      cell: (ticket) => (
        <span className="flex flex-col">
          <span>{ticket.customer.full_name}</span>
          <span className="font-mono text-ink-muted">{formatPhone(ticket.customer.phone)}</span>
        </span>
      ),
    },
    {
      key: "pesanan",
      header: "Pesanan",
      cell: (ticket) => (ticket.order_code ? <span className="font-mono">{ticket.order_code}</span> : "—"),
    },
    {
      key: "terakhir",
      header: "Pesan terakhir",
      cell: (ticket) => (
        <span className="flex flex-col">
          <RelativeTime iso={ticket.last_message_at} now={now} />
          <span className="text-ink-muted">
            dari {SENDER_LABELS[ticket.last_sender_role] ?? ticket.last_sender_role}
          </span>
        </span>
      ),
    },
  ];
  // Di tab per status semua baris berstatus sama; kolom status hanya berguna di Semua.
  return tab === "semua"
    ? [...columns, { key: "status", header: "Status", cell: (ticket) => <TicketStatusBadge status={ticket.status} /> }]
    : columns;
}

/** Daftar tiket bantuan. Tab status, pencarian (ditunda), dan halaman tinggal di URL; tab Menunggu tanpa ?status. */
export function TicketTable({
  rows,
  tab,
  counts,
  page,
  total,
  now,
}: {
  rows: TicketSummary[];
  tab: TicketTab;
  counts?: TicketMeta["counts"];
  page: number;
  total: number;
  now: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [text, setText] = useState(query);
  // Nilai terbaru untuk timer; state di closure bisa basi saat timer berjalan.
  const latest = useRef({ params: params.toString(), text });
  useEffect(() => {
    latest.current = { params: params.toString(), text };
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelTimer = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => cancelTimer, []);

  // Tautan/Back mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && latest.current.text.trim() !== query) setText(query);
  }, [query]);

  function navigate(changes: Record<string, string>) {
    cancelTimer();
    // Pindah tab membawa ketikan q yang belum sempat dikirim.
    const allChanges = "q" in changes ? changes : { ...changes, q: latest.current.text.trim() };
    router.replace(buildUrl(pathname, latest.current.params, { ...allChanges, page: "" }), { scroll: false });
  }

  function scheduleSearch(value: string) {
    setText(value);
    cancelTimer();
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 400);
  }

  function clearSearch() {
    setText("");
    navigate({ q: "" });
  }

  const tabCount = (id: TicketTab) =>
    counts ? (id === "semua" ? counts.open + counts.answered + counts.closed : counts[id]) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
        />
        <Input
          type="search"
          aria-label="Cari tiket"
          placeholder="Cari kode, judul, nama, atau nomor pembeli"
          value={text}
          onChange={(event) => scheduleSearch(event.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs
        label="Status tiket"
        value={tab}
        onChange={(id) => navigate({ status: id === "open" ? "" : id })}
        tabs={TICKET_TABS.map((tabItem) => ({ id: tabItem.id, label: tabItem.label, count: tabCount(tabItem.id) }))}
      />

      {rows.length === 0 ? (
        query || page > 1 ? (
          <EmptyState
            icon={SearchX}
            title="Tiket tidak ditemukan"
            body={query ? `Tidak ada tiket yang cocok dengan "${query}".` : "Halaman ini kosong."}
            action={
              <Button variant="secondary" onClick={clearSearch}>
                {query ? "Hapus pencarian" : "Ke halaman pertama"}
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Inbox} title={EMPTY_MESSAGES[tab].title} body={EMPTY_MESSAGES[tab].body} />
        )
      ) : (
        <>
          {tab === "open" && <p className="text-sm text-ink-muted">Yang paling lama menunggu ada di atas.</p>}
          <div className="hidden lg:block">
            <DataTable
              caption="Daftar tiket"
              columns={buildColumns(tab, now)}
              rows={rows}
              rowKey={(ticket) => ticket.code}
              onRowClick={(ticket) => router.push(ticketHref(ticket))}
            />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((ticket) => (
              <li key={ticket.code}>
                <Link
                  href={ticketHref(ticket)}
                  className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">{ticket.code}</span>
                    <TicketStatusBadge status={ticket.status} />
                  </span>
                  <span className="font-semibold text-ink">{ticket.subject}</span>
                  <span className="text-sm text-ink-muted">
                    {categoryLabel(ticket.category)} · {ticket.customer.full_name} ·{" "}
                    {formatPhone(ticket.customer.phone)}
                    {ticket.order_code && (
                      <>
                        {" "}
                        · <span className="font-mono">{ticket.order_code}</span>
                      </>
                    )}
                  </span>
                  <span className="text-sm text-ink-muted">
                    <RelativeTime iso={ticket.last_message_at} now={now} /> · dari{" "}
                    {SENDER_LABELS[ticket.last_sender_role] ?? ticket.last_sender_role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            limit={LIMIT_TICKETS}
            hrefFor={(pageNumber) =>
              buildUrl(pathname, params.toString(), { page: pageNumber > 1 ? String(pageNumber) : "" })
            }
          />
        </>
      )}
    </div>
  );
}
