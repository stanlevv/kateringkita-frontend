import { Banknote, History, Undo2 } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatJam, formatRupiah, formatTanggal, formatTelepon } from "@/lib/format";
import { requireAdmin } from "@/services/authService";
import { getRefundMenunggu, getRiwayatPencairan, getSaldoPenjual, LIMIT_PENCAIRAN } from "@/services/pencairanService";
import type { Pencairan, RefundMenunggu, SaldoPenjual } from "@/types/pencairan";
import { CatatPencairan } from "./components/CatatPencairan";
import { TandaiRefund } from "./components/TandaiRefund";

const waktu = (iso: string) => `${formatTanggal(iso)} ${formatJam(iso)}`;
const METODE: Record<RefundMenunggu["method"], string> = { va: "Virtual Account", online: "Bayar online", qris: "QRIS toko" };
const OLEH = { customer: "pembeli", merchant: "penjual", system: "sistem" } as const;

const rekening = (s: SaldoPenjual) =>
  s.account ? <span>{s.account.bank_name} <span className="font-mono">{s.account.account_number}</span><br /><span className="text-ink-muted">a.n. {s.account.account_name}</span></span> : "—";

const KOLOM_REFUND: Column<RefundMenunggu>[] = [
  { key: "kode", header: "Pesanan", cell: (r) => <span className="font-mono">{r.code}</span> },
  {
    key: "pembeli", header: "Pembeli", wrap: true,
    cell: (r) => <span>{r.customer_name}{r.customer_phone && <><br /><span className="text-ink-muted">{formatTelepon(r.customer_phone)}</span></>}</span>,
  },
  { key: "toko", header: "Toko", cell: (r) => <span>{r.business_name}{r.dine_in && <span className="text-ink-muted"> · meja</span>}</span> },
  {
    key: "sebab", header: "Sebab", wrap: true,
    cell: (r) => (r.status === "expired"
      ? "Dibayar setelah batas waktu"
      : `Dibatalkan ${r.cancelled_by ? OLEH[r.cancelled_by] : ""}${r.cancel_reason ? `: ${r.cancel_reason}` : ""}`),
  },
  { key: "metode", header: "Metode", cell: (r) => METODE[r.method] },
  { key: "dibayar", header: "Dibayar", cell: (r) => waktu(r.paid_at) },
  { key: "nominal", header: "Nominal", align: "right", cell: (r) => <span className="font-mono">{formatRupiah(r.amount)}</span> },
  { key: "aksi", header: "Aksi", cell: (r) => <TandaiRefund refund={r} /> },
];

const KOLOM_RIWAYAT: Column<Pencairan>[] = [
  { key: "waktu", header: "Waktu", cell: (p) => waktu(p.created_at) },
  { key: "toko", header: "Toko", cell: (p) => <span className="font-medium">{p.business_name}</span> },
  { key: "nominal", header: "Nominal", align: "right", cell: (p) => <span className="font-mono">{formatRupiah(p.amount)}</span> },
  { key: "pesanan", header: "Pesanan", align: "right", cell: (p) => p.orders_count },
  { key: "rekening", header: "Rekening", wrap: true, cell: (p) => <span>{p.bank_name} <span className="font-mono">{p.account_number}</span> a.n. {p.account_name}</span> },
  { key: "ref", header: "Referensi", wrap: true, cell: (p) => <span><span className="font-mono">{p.reference}</span>{p.note && <><br /><span className="text-ink-muted">{p.note}</span></>}</span> },
  { key: "admin", header: "Admin", cell: (p) => p.admin_name ?? "—" },
];

// F26 — pembayaran VA/online masuk ke akun Midtrans platform. Admin super mentransfer bagian toko (subtotal − promo toko)
// lalu mencatatnya, dan mengembalikan dana pesanan batal yang sudah lunas. Halaman riwayat di URL: ?page.
export default async function PencairanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("super");
  const n = Number((await searchParams).page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  const [saldo, refund, riwayat] = await Promise.all([getSaldoPenjual(), getRefundMenunggu(), getRiwayatPencairan(page)]);
  const total = (riwayat.meta as { total?: number } | undefined)?.total ?? riwayat.data?.length ?? 0;

  return (
    <PageHeader title="Pencairan dana" description="Transfer bagian toko dari pembayaran Virtual Account dan online, lalu catat di sini. Kembalikan dana pesanan batal yang sudah dibayar.">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Saldo per toko</h2>
            <p className="text-sm text-ink-muted">Pesanan selesai yang dibayar non-tunai dan belum dicairkan. Bagian toko = subtotal dikurangi promo toko; biaya layanan dan biaya Midtrans milik platform.</p>
          </div>
          {"error" in saldo ? (
            <GagalMuat judul="Saldo belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
          ) : saldo.data.rows.length === 0 ? (
            <EmptyState icon={Banknote} title="Tidak ada saldo" body="Semua bagian toko sudah dicairkan." />
          ) : (
            <>
              <p className="text-sm text-ink-muted">Dihitung {waktu(saldo.data.as_of)}. Muat ulang halaman untuk angka terbaru.</p>
              <DataTable
                caption="Saldo per toko"
                rows={saldo.data.rows}
                rowKey={(s) => String(s.merchant_id)}
                columns={[
                  { key: "toko", header: "Toko", cell: (s) => <span className="font-medium">{s.business_name}</span> },
                  { key: "rekening", header: "Rekening", wrap: true, cell: rekening },
                  { key: "pesanan", header: "Pesanan", align: "right", cell: (s) => s.orders },
                  { key: "sejak", header: "Sejak", cell: (s) => formatTanggal(s.since) },
                  { key: "saldo", header: "Saldo", align: "right", cell: (s) => <span className="font-mono font-semibold">{formatRupiah(s.amount)}</span> },
                  { key: "aksi", header: "Aksi", cell: (s) => <CatatPencairan saldo={s} asOf={saldo.data.as_of} /> },
                ]}
              />
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Dana yang harus dikembalikan</h2>
            <p className="text-sm text-ink-muted">Pembayaran Midtrans yang lunas, tetapi pesanannya ditolak, dibatalkan, atau dibayar setelah batas waktu.</p>
          </div>
          {"error" in refund ? (
            <GagalMuat judul="Daftar pengembalian belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
          ) : refund.data.length === 0 ? (
            <EmptyState icon={Undo2} title="Tidak ada dana yang perlu dikembalikan" body="Pesanan batal yang sudah dibayar akan muncul di sini." />
          ) : (
            <DataTable caption="Dana yang harus dikembalikan" rows={refund.data} rowKey={(r) => r.code} columns={KOLOM_REFUND} />
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Riwayat pencairan</h2>
          {!riwayat.ok || !riwayat.data ? (
            <GagalMuat judul="Riwayat belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
          ) : riwayat.data.length === 0 ? (
            <EmptyState icon={History} title="Belum ada pencairan" body="Pencairan yang dicatat akan muncul di sini." />
          ) : (
            <>
              <DataTable caption="Riwayat pencairan" rows={riwayat.data} rowKey={(p) => String(p.id)} columns={KOLOM_RIWAYAT} />
              <Pagination page={page} total={total} limit={LIMIT_PENCAIRAN} hrefFor={(p) => `/admin/pencairan?page=${p}`} />
            </>
          )}
        </Card>
      </div>
    </PageHeader>
  );
}
