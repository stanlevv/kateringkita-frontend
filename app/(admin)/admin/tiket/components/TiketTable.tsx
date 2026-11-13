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
import { formatTelepon } from "@/lib/format";
import { urlDengan } from "@/lib/url";
import { LABEL_PENGIRIM, LIMIT_TIKET, TAB_TIKET, labelKategori, type TabTiket } from "@/services/adminTiketService";
import type { MetaTiket, TiketRingkas } from "@/types/admin";
import { StatusTiket, WaktuRelatif } from "./StatusTiket";

const detail = (t: TiketRingkas) => `/admin/tiket/${encodeURIComponent(t.code)}`;

const KOSONG: Record<TabTiket, { title: string; body: string }> = {
  open: { title: "Tidak ada tiket yang menunggu", body: "Semua tiket sudah dibalas. Tiket baru dari pembeli akan muncul di sini." },
  answered: { title: "Tidak ada tiket yang menunggu pembeli", body: "Tiket yang sudah dibalas admin dan belum ditutup akan muncul di sini." },
  closed: { title: "Belum ada tiket yang ditutup", body: "Tiket yang ditutup admin atau pembeli akan muncul di sini." },
  semua: { title: "Belum ada tiket", body: "Tiket bantuan dari pembeli akan muncul di sini." },
};

function kolom(tab: TabTiket, sekarang: number): Column<TiketRingkas>[] {
  const k: Column<TiketRingkas>[] = [
    { key: "kode", header: "Tiket", cell: (t) => <Link href={detail(t)} className="font-mono font-semibold text-primary underline-offset-2 hover:underline">{t.code}</Link> },
    {
      key: "judul", header: "Judul", wrap: true,
      cell: (t) => (
        <span className="flex flex-col">
          <span className="font-medium">{t.subject}</span>
          <span className="text-ink-muted">{labelKategori(t.category)}</span>
          {t.last_message_preview && <span className="line-clamp-1 text-ink-muted">{t.last_message_preview}</span>}
        </span>
      ),
    },
    { key: "pembeli", header: "Pembeli", cell: (t) => <span className="flex flex-col"><span>{t.customer.full_name}</span><span className="font-mono text-ink-muted">{formatTelepon(t.customer.phone)}</span></span> },
    { key: "pesanan", header: "Pesanan", cell: (t) => (t.order_code ? <span className="font-mono">{t.order_code}</span> : "—") },
    {
      key: "terakhir", header: "Pesan terakhir",
      cell: (t) => <span className="flex flex-col"><WaktuRelatif iso={t.last_message_at} sekarang={sekarang} /><span className="text-ink-muted">dari {LABEL_PENGIRIM[t.last_sender_role] ?? t.last_sender_role}</span></span>,
    },
  ];
  // Di tab per status semua baris berstatus sama; kolom status hanya berguna di Semua.
  return tab === "semua" ? [...k, { key: "status", header: "Status", cell: (t) => <StatusTiket status={t.status} /> }] : k;
}

/** Daftar tiket bantuan. Tab status, pencarian (ditunda), dan halaman tinggal di URL; tab Menunggu tanpa ?status. */
export function TiketTable({ rows, tab, counts, page, total, sekarang }: {
  rows: TiketRingkas[]; tab: TabTiket; counts?: MetaTiket["counts"]; page: number; total: number; sekarang: number;
}) {
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

  // Tautan/Back mengubah ?q= dari luar: samakan kotak cari, kecuali pengguna sedang mengetik.
  useEffect(() => {
    if (!timer.current && terbaru.current.teks.trim() !== q) setTeks(q);
  }, [q]);

  function ke(ubahan: Record<string, string>) {
    batalkanTimer();
    // Pindah tab membawa ketikan q yang belum sempat dikirim.
    const semua = "q" in ubahan ? ubahan : { ...ubahan, q: terbaru.current.teks.trim() };
    router.replace(urlDengan(path, terbaru.current.params, { ...semua, page: "" }), { scroll: false });
  }

  function ketik(v: string) {
    setTeks(v);
    batalkanTimer();
    timer.current = setTimeout(() => ke({ q: v.trim() }), 400);
  }

  function hapusCari() {
    setTeks("");
    ke({ q: "" });
  }

  const jumlah = (id: TabTiket) => (counts ? (id === "semua" ? counts.open + counts.answered + counts.closed : counts[id]) : undefined);

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
        <Input type="search" aria-label="Cari tiket" placeholder="Cari kode, judul, nama, atau nomor pembeli" value={teks} onChange={(e) => ketik(e.target.value)} className="pl-10" />
      </div>
      <Tabs label="Status tiket" value={tab} onChange={(id) => ke({ status: id === "open" ? "" : id })}
        tabs={TAB_TIKET.map((t) => ({ id: t.id, label: t.label, count: jumlah(t.id) }))} />

      {rows.length === 0 ? (
        q || page > 1 ? (
          <EmptyState icon={SearchX} title="Tiket tidak ditemukan" body={q ? `Tidak ada tiket yang cocok dengan "${q}".` : "Halaman ini kosong."}
            action={<Button variant="secondary" onClick={hapusCari}>{q ? "Hapus pencarian" : "Ke halaman pertama"}</Button>} />
        ) : (
          <EmptyState icon={Inbox} title={KOSONG[tab].title} body={KOSONG[tab].body} />
        )
      ) : (
        <>
          {tab === "open" && <p className="text-sm text-ink-muted">Yang paling lama menunggu ada di atas.</p>}
          <div className="hidden lg:block">
            <DataTable caption="Daftar tiket" columns={kolom(tab, sekarang)} rows={rows} rowKey={(t) => t.code} onRowClick={(t) => router.push(detail(t))} />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((t) => (
              <li key={t.code}>
                <Link href={detail(t)} className="flex min-h-11 flex-col gap-2 rounded-lg border border-line bg-surface p-4 focus-visible:ring-2 focus-visible:ring-focus">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">{t.code}</span>
                    <StatusTiket status={t.status} />
                  </span>
                  <span className="font-semibold text-ink">{t.subject}</span>
                  <span className="text-sm text-ink-muted">
                    {labelKategori(t.category)} · {t.customer.full_name} · {formatTelepon(t.customer.phone)}{t.order_code && <> · <span className="font-mono">{t.order_code}</span></>}
                  </span>
                  <span className="text-sm text-ink-muted">
                    <WaktuRelatif iso={t.last_message_at} sekarang={sekarang} /> · dari {LABEL_PENGIRIM[t.last_sender_role] ?? t.last_sender_role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={total} limit={LIMIT_TIKET} hrefFor={(p) => urlDengan(path, params.toString(), { page: p > 1 ? String(p) : "" })} />
        </>
      )}
    </div>
  );
}
