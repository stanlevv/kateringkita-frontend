// Komponen TransactionTable: buku transaksi /laporan (satu baris per menu dalam pesanan selesai) dengan paginasi
// lewat URL dan tombol Unduh CSV. Baris sudah dipotong per halaman oleh page.tsx; CSV diambil dari route
// /api/laporan/csv. CSV = berkas teks berpemisah koma yang bisa dibuka di Excel.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
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
import { formatTime, formatRupiah, formatDate } from "@/lib/format";
import { LIMIT_TRANSACTIONS } from "@/lib/report";
import type { PaymentMethod } from "@/types/order";
import type { Transaction } from "@/types/report";

/** Nama metode bayar untuk ditampilkan (kunci = nilai payment_method dari API). */
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qris: "QRIS toko",
  va: "Virtual Account",
  cod: "Tunai",
  online: "Bayar online",
};
/** Laba satu baris transaksi: total dikurangi HPP. */
const profit = (transaction: Transaction) => transaction.total - transaction.hpp_total;
/** Waktu pesanan selesai (bukan waktu dibuat), mis. "31 Okt 2026, 11.42". */
const completedTime = (transaction: Transaction) =>
  `${formatDate(transaction.completed_at)}, ${formatTime(transaction.completed_at)}`;

/** Kolom tabel di layar lebar; `key` tiap kolom dipakai DataTable sebagai kunci. */
const COLUMNS: Column<Transaction>[] = [
  {
    key: "kode",
    header: "Kode",
    cell: (transaction) => <span className="font-mono font-semibold">{transaction.code}</span>,
  },
  { key: "waktu", header: "Waktu", cell: completedTime },
  { key: "menu", header: "Menu", cell: (transaction) => transaction.menu_name },
  { key: "qty", header: "Qty", align: "right", cell: (transaction) => transaction.qty },
  { key: "omzet", header: "Omzet", align: "right", cell: (transaction) => formatRupiah(transaction.total) },
  { key: "hpp", header: "HPP", align: "right", cell: (transaction) => formatRupiah(transaction.hpp_total) },
  { key: "laba", header: "Laba", align: "right", cell: (transaction) => formatRupiah(profit(transaction)) },
  { key: "metode", header: "Metode", cell: (transaction) => PAYMENT_METHOD_LABELS[transaction.payment_method] },
];

/**
 * Kartu "Buku transaksi". Di layar ≥ 1024 px tampil sebagai tabel, di layar lebih kecil sebagai kartu bertumpuk.
 * @param props.rows baris transaksi untuk halaman ini
 * @param props.total jumlah semua baris dalam rentang (untuk paginasi)
 * @param props.page halaman sekarang
 * @param props.startDate tanggal awal rentang (YYYY-MM-DD)
 * @param props.endDate tanggal akhir rentang (YYYY-MM-DD)
 * @returns Card berisi tombol unduh, tabel atau kartu, dan paginasi
 */
export function TransactionTable({
  rows,
  total,
  page,
  startDate,
  endDate,
}: {
  rows: Transaction[];
  total: number;
  page: number;
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  /** Mengunduh CSV rentang ini; sesi habis dan galat server ditampilkan sebagai toast. */
  async function downloadCsv() {
    // 1. Minta CSV ke route API web (cookie sesi ikut terkirim otomatis).
    setDownloading(true);
    try {
      const response = await fetch(`/api/laporan/csv?dari=${startDate}&sampai=${endDate}`);
      // 2. Sesi habis: proxy mengalihkan ke halaman masuk (HTML, status 200) atau rute menjawab 401.
      if (response.redirected || response.status === 401) {
        const loginUrl = `/login?next=${encodeURIComponent(`/laporan?dari=${startDate}&sampai=${endDate}`)}`;
        toast({
          tone: "danger",
          message: "Sesi berakhir, silakan masuk lagi.",
          action: { label: "Masuk lagi", onClick: () => router.push(loginUrl) },
        });
        return;
      }
      // 3. Bukan CSV (galat server): pakai pesan dari server bila ada.
      if (!response.ok || !response.headers.get("content-type")?.startsWith("text/csv")) {
        const serverMessage = ((await response.json().catch(() => null)) as { message?: string } | null)?.message;
        throw new Error(serverMessage);
      }
      // 4. Simpan berkas lewat tautan sementara ke blob (isi berkas di memori peramban), lalu lepas blob-nya.
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `laporan-${startDate}-${endDate}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Unduhan gagal. Periksa koneksi lalu coba lagi.";
      toast({ tone: "danger", message, action: { label: "Coba lagi", onClick: downloadCsv } });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Buku transaksi</h2>
        <Button
          variant="secondary"
          onClick={downloadCsv}
          disabled={total === 0}
          loading={downloading}
          loadingText="Mengunduh..."
        >
          <Download aria-hidden className="size-4" />
          Unduh CSV
        </Button>
      </div>
      {total === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada transaksi di rentang ini"
          body="Transaksi muncul setelah ada pesanan yang selesai. Coba pilih rentang tanggal lain."
        />
      ) : (
        <>
          {/* Delapan kolom tidak muat di bawah 1024 px; di sana kartu bertumpuk dengan data yang sama. */}
          <div className="hidden lg:block">
            <DataTable
              caption="Buku transaksi"
              columns={COLUMNS}
              rows={rows}
              rowKey={(transaction, i) => `${transaction.code}-${i}`}
            />
          </div>
          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((transaction, i) => (
              <li key={`${transaction.code}-${i}`} className="flex flex-col gap-1 rounded-lg border border-line p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-ink">{transaction.code}</span>
                  <span className="text-sm text-ink-muted">{completedTime(transaction)}</span>
                </span>
                <span className="text-ink">
                  {transaction.qty}× {transaction.menu_name}
                </span>
                <span className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
                  <span>{PAYMENT_METHOD_LABELS[transaction.payment_method]}</span>
                  <span className="font-mono">Omzet {formatRupiah(transaction.total)}</span>
                </span>
                <span className="flex flex-wrap justify-between gap-2 font-mono text-sm text-ink-muted">
                  <span>HPP {formatRupiah(transaction.hpp_total)}</span>
                  <span className="font-semibold text-ink">Laba {formatRupiah(profit(transaction))}</span>
                </span>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            limit={LIMIT_TRANSACTIONS}
            hrefFor={(pageNumber) =>
              `/laporan?dari=${startDate}&sampai=${endDate}${pageNumber > 1 ? `&page=${pageNumber}` : ""}`
            }
          />
        </>
      )}
    </Card>
  );
}
