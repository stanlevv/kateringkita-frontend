"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ReceiptText } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { toast } from "@/app/components/ui/Toast";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format";
import { LIMIT_TRANSAKSI } from "@/lib/laporan";
import type { PaymentMethod } from "@/types/order";
import type { Transaction } from "@/types/report";

const METODE: Record<PaymentMethod, string> = { qris: "QRIS toko", va: "Virtual Account", cod: "Tunai", online: "Bayar online" };
const laba = (t: Transaction) => t.total - t.hpp_total;
const waktu = (t: Transaction) => `${formatTanggal(t.completed_at)}, ${formatJam(t.completed_at)}`;

const KOLOM: Column<Transaction>[] = [
  { key: "kode", header: "Kode", cell: (t) => <span className="font-mono font-semibold">{t.code}</span> },
  { key: "waktu", header: "Waktu", cell: waktu },
  { key: "menu", header: "Menu", cell: (t) => t.menu_name },
  { key: "qty", header: "Qty", align: "right", cell: (t) => t.qty },
  { key: "omzet", header: "Omzet", align: "right", cell: (t) => formatRupiah(t.total) },
  { key: "hpp", header: "HPP", align: "right", cell: (t) => formatRupiah(t.hpp_total) },
  { key: "laba", header: "Laba", align: "right", cell: (t) => formatRupiah(laba(t)) },
  { key: "metode", header: "Metode", cell: (t) => METODE[t.payment_method] },
];

/** LP-N3 (halaman sudah dipotong server), LP-N4/E2 unduh CSV, LP-S1. */
export function TransactionTable({ rows, total, page, dari, sampai }: { rows: Transaction[]; total: number; page: number; dari: string; sampai: string }) {
  const router = useRouter();
  const [mengunduh, setMengunduh] = useState(false);

  async function unduh() {
    setMengunduh(true);
    try {
      const res = await fetch(`/api/laporan/csv?dari=${dari}&sampai=${sampai}`);
      // Sesi habis: proxy mengalihkan ke halaman masuk (HTML, status 200) atau rute menjawab 401.
      if (res.redirected || res.status === 401) {
        const ke = `/login?next=${encodeURIComponent(`/laporan?dari=${dari}&sampai=${sampai}`)}`;
        toast({ tone: "danger", message: "Sesi berakhir, silakan masuk lagi.", action: { label: "Masuk lagi", onClick: () => router.push(ke) } });
        return;
      }
      if (!res.ok || !res.headers.get("content-type")?.startsWith("text/csv")) {
        const pesan = ((await res.json().catch(() => null)) as { message?: string } | null)?.message;
        throw new Error(pesan);
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await res.blob());
      a.download = `laporan-${dari}-${sampai}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      const pesan = e instanceof Error && e.message ? e.message : "Unduhan gagal. Periksa koneksi lalu coba lagi.";
      toast({ tone: "danger", message: pesan, action: { label: "Coba lagi", onClick: unduh } });
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Buku transaksi</h2>
        <Button variant="secondary" onClick={unduh} disabled={total === 0} loading={mengunduh} loadingText="Mengunduh...">
          <Download aria-hidden className="size-4" />Unduh CSV
        </Button>
      </div>
      {total === 0 ? (
        <EmptyState icon={ReceiptText} title="Belum ada transaksi di rentang ini" body="Transaksi muncul setelah ada pesanan yang selesai. Coba pilih rentang tanggal lain." />
      ) : (
        <>
          {/* Delapan kolom tidak muat di bawah 1024 px; di sana kartu bertumpuk dengan data yang sama. */}
          <div className="hidden lg:block">
            <DataTable caption="Buku transaksi" columns={KOLOM} rows={rows} rowKey={(t, i) => `${t.code}-${i}`} />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((t, i) => (
              <li key={`${t.code}-${i}`} className="flex flex-col gap-1 rounded-lg border border-line p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-ink">{t.code}</span>
                  <span className="text-sm text-ink-muted">{waktu(t)}</span>
                </span>
                <span className="text-ink">{t.qty}× {t.menu_name}</span>
                <span className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
                  <span>{METODE[t.payment_method]}</span>
                  <span className="font-mono">Omzet {formatRupiah(t.total)}</span>
                </span>
                <span className="flex flex-wrap justify-between gap-2 font-mono text-sm text-ink-muted">
                  <span>HPP {formatRupiah(t.hpp_total)}</span>
                  <span className="font-semibold text-ink">Laba {formatRupiah(laba(t))}</span>
                </span>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={total} limit={LIMIT_TRANSAKSI} hrefFor={(p) => `/laporan?dari=${dari}&sampai=${sampai}${p > 1 ? `&page=${p}` : ""}`} />
        </>
      )}
    </Card>
  );
}
