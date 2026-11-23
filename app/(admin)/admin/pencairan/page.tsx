// Halaman /admin/pencairan: saldo dan pencairan dana toko, pengembalian dana (refund), dan riwayat pencairan, khusus
// admin super. Pembayaran Virtual Account dan online masuk ke akun Midtrans milik platform; admin mentransfer bagian toko
// (saldo) ke rekening toko lalu mencatatnya di sini. Refund = mengembalikan uang pembeli untuk pesanan yang batal
// padahal sudah lunas. Server component: mengambil saldo (GET /admin/payouts/balances), refund (GET /admin/refunds),
// dan riwayat (GET /admin/payouts?page=) lewat services/payout.service.ts secara bersamaan.
import { Banknote, History, Undo2 } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatTime, formatRupiah, formatDate, formatPhone } from "@/lib/format";
import { requireAdmin } from "@/services/auth.service";
import { getPendingRefunds, getPayoutHistory, getMerchantBalances, LIMIT_PAYOUTS } from "@/services/payout.service";
import type { Payout, PendingRefund, MerchantBalance } from "@/types/payout";
import { RecordPayoutDialog } from "./components/RecordPayoutDialog";
import { MarkRefundDialog } from "./components/MarkRefundDialog";

// Tanggal dan jam (WIB) dari waktu ISO; label metode bayar dan pihak yang membatalkan.
const formatDateTime = (iso: string) => `${formatDate(iso)} ${formatTime(iso)}`;
const PAYMENT_METHOD_LABELS: Record<PendingRefund["method"], string> = {
  va: "Virtual Account",
  online: "Bayar online",
  qris: "QRIS toko",
};
const CANCELLED_BY_LABELS = { customer: "pembeli", merchant: "penjual", system: "sistem" } as const;

// Isi sel rekening toko, atau "—" bila toko belum mengisi rekening.
const bankAccountCell = (balance: MerchantBalance) =>
  balance.account ? (
    <span>
      {balance.account.bank_name} <span className="font-mono">{balance.account.account_number}</span>
      <br />
      <span className="text-ink-muted">a.n. {balance.account.account_name}</span>
    </span>
  ) : (
    "—"
  );

// Kolom tabel dana yang harus dikembalikan; kolom Aksi berisi MarkRefundDialog.
const REFUND_COLUMNS: Column<PendingRefund>[] = [
  { key: "kode", header: "Pesanan", cell: (refund) => <span className="font-mono">{refund.code}</span> },
  {
    key: "pembeli",
    header: "Pembeli",
    wrap: true,
    cell: (refund) => (
      <span>
        {refund.customer_name}
        {refund.customer_phone && (
          <>
            <br />
            <span className="text-ink-muted">{formatPhone(refund.customer_phone)}</span>
          </>
        )}
      </span>
    ),
  },
  {
    key: "toko",
    header: "Toko",
    cell: (refund) => (
      <span>
        {refund.business_name}
        {refund.dine_in && <span className="text-ink-muted"> · meja</span>}
      </span>
    ),
  },
  {
    key: "sebab",
    header: "Sebab",
    wrap: true,
    cell: (refund) =>
      refund.status === "expired"
        ? "Dibayar setelah batas waktu"
        : `Dibatalkan ${refund.cancelled_by ? CANCELLED_BY_LABELS[refund.cancelled_by] : ""}${refund.cancel_reason ? `: ${refund.cancel_reason}` : ""}`,
  },
  { key: "metode", header: "Metode", cell: (refund) => PAYMENT_METHOD_LABELS[refund.method] },
  { key: "dibayar", header: "Dibayar", cell: (refund) => formatDateTime(refund.paid_at) },
  {
    key: "nominal",
    header: "Nominal",
    align: "right",
    cell: (refund) => <span className="font-mono">{formatRupiah(refund.amount)}</span>,
  },
  { key: "aksi", header: "Aksi", cell: (refund) => <MarkRefundDialog refund={refund} /> },
];

// Kolom tabel riwayat pencairan yang sudah dicatat.
const HISTORY_COLUMNS: Column<Payout>[] = [
  { key: "waktu", header: "Waktu", cell: (payout) => formatDateTime(payout.created_at) },
  { key: "toko", header: "Toko", cell: (payout) => <span className="font-medium">{payout.business_name}</span> },
  {
    key: "nominal",
    header: "Nominal",
    align: "right",
    cell: (payout) => <span className="font-mono">{formatRupiah(payout.amount)}</span>,
  },
  { key: "pesanan", header: "Pesanan", align: "right", cell: (payout) => payout.orders_count },
  {
    key: "rekening",
    header: "Rekening",
    wrap: true,
    cell: (payout) => (
      <span>
        {payout.bank_name} <span className="font-mono">{payout.account_number}</span> a.n. {payout.account_name}
      </span>
    ),
  },
  {
    key: "ref",
    header: "Referensi",
    wrap: true,
    cell: (payout) => (
      <span>
        <span className="font-mono">{payout.reference}</span>
        {payout.note && (
          <>
            <br />
            <span className="text-ink-muted">{payout.note}</span>
          </>
        )}
      </span>
    ),
  },
  { key: "admin", header: "Admin", cell: (payout) => payout.admin_name ?? "—" },
];

/**
 * Halaman pencairan. Bagian toko = subtotal dikurangi promo toko; biaya layanan dan biaya Midtrans milik platform.
 * Ketiga bagian (saldo, refund, riwayat) dimuat terpisah, jadi satu yang gagal tidak menggagalkan yang lain.
 * @param props.searchParams parameter URL: `page` (halaman riwayat)
 * @returns PageHeader berisi tiga kartu: saldo per toko, dana yang harus dikembalikan, riwayat pencairan
 */
export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  // 1. Khusus admin super; nomor halaman riwayat yang tidak sah menjadi 1.
  await requireAdmin("super");
  const pageParam = Number((await searchParams).page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 2. Ambil ketiga data sekaligus; total riwayat untuk paginasi ada di `meta`.
  const [balances, refunds, history] = await Promise.all([
    getMerchantBalances(),
    getPendingRefunds(),
    getPayoutHistory(page),
  ]);
  const total = (history.meta as { total?: number } | undefined)?.total ?? history.data?.length ?? 0;

  return (
    <PageHeader
      title="Pencairan dana"
      description="Transfer bagian toko dari pembayaran Virtual Account dan online, lalu catat di sini. Kembalikan dana pesanan batal yang sudah dibayar."
    >
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Saldo per toko</h2>
            <p className="text-sm text-ink-muted">
              Pesanan selesai yang dibayar non-tunai dan belum dicairkan. Bagian toko = subtotal dikurangi promo toko;
              biaya layanan dan biaya Midtrans milik platform.
            </p>
          </div>
          {"error" in balances ? (
            <LoadError
              title="Saldo belum bisa dimuat"
              body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
            />
          ) : balances.data.rows.length === 0 ? (
            <EmptyState icon={Banknote} title="Tidak ada saldo" body="Semua bagian toko sudah dicairkan." />
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                Dihitung {formatDateTime(balances.data.as_of)}. Muat ulang halaman untuk angka terbaru.
              </p>
              <DataTable
                caption="Saldo per toko"
                rows={balances.data.rows}
                rowKey={(balance) => String(balance.merchant_id)}
                columns={[
                  {
                    key: "toko",
                    header: "Toko",
                    cell: (balance) => <span className="font-medium">{balance.business_name}</span>,
                  },
                  { key: "rekening", header: "Rekening", wrap: true, cell: bankAccountCell },
                  { key: "pesanan", header: "Pesanan", align: "right", cell: (balance) => balance.orders },
                  { key: "sejak", header: "Sejak", cell: (balance) => formatDate(balance.since) },
                  // Voucher platform dibayar platform; porsi besar di satu toko bisa berarti akun pembeli palsu, periksa dulu
                  {
                    key: "platform",
                    header: "Voucher platform",
                    align: "right",
                    cell: (balance) =>
                      balance.platform_discount ? (
                        <span className="font-mono">{formatRupiah(balance.platform_discount)}</span>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "saldo",
                    header: "Saldo",
                    align: "right",
                    cell: (balance) => <span className="font-mono font-semibold">{formatRupiah(balance.amount)}</span>,
                  },
                  {
                    key: "aksi",
                    header: "Aksi",
                    cell: (balance) => <RecordPayoutDialog balance={balance} asOf={balances.data.as_of} />,
                  },
                ]}
              />
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Dana yang harus dikembalikan</h2>
            <p className="text-sm text-ink-muted">
              Pembayaran Midtrans yang lunas, tetapi pesanannya ditolak, dibatalkan, atau dibayar setelah batas waktu.
            </p>
          </div>
          {"error" in refunds ? (
            <LoadError
              title="Daftar pengembalian belum bisa dimuat"
              body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
            />
          ) : refunds.data.length === 0 ? (
            <EmptyState
              icon={Undo2}
              title="Tidak ada dana yang perlu dikembalikan"
              body="Pesanan batal yang sudah dibayar akan muncul di sini."
            />
          ) : (
            <DataTable
              caption="Dana yang harus dikembalikan"
              rows={refunds.data}
              rowKey={(refund) => refund.code}
              columns={REFUND_COLUMNS}
            />
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Riwayat pencairan</h2>
          {!history.ok || !history.data ? (
            <LoadError
              title="Riwayat belum bisa dimuat"
              body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
            />
          ) : history.data.length === 0 ? (
            <EmptyState icon={History} title="Belum ada pencairan" body="Pencairan yang dicatat akan muncul di sini." />
          ) : (
            <>
              <DataTable
                caption="Riwayat pencairan"
                rows={history.data}
                rowKey={(payout) => String(payout.id)}
                columns={HISTORY_COLUMNS}
              />
              <Pagination
                page={page}
                total={total}
                limit={LIMIT_PAYOUTS}
                hrefFor={(pageNumber) => `/admin/pencairan?page=${pageNumber}`}
              />
            </>
          )}
        </Card>
      </div>
    </PageHeader>
  );
}
