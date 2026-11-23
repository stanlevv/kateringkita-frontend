import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
import { Banner } from "@/app/components/ui/Banner";
import { cx } from "@/app/components/ui/cx";
import { formatRupiah, formatPhone } from "@/lib/format";
import { whatsappLink } from "@/services/admin-merchant.service";
import { SENDER_LABELS, categoryLabel, ticketOrderStatus } from "@/services/admin-ticket.service";
import type { TicketDetail, TicketMessage } from "@/types/admin";
import { BalasTiket } from "./TicketReplyForm";
import { StatusTiket, waktuLengkap } from "./TicketStatusBadge";

const Baris = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex flex-col">
    <dt className="text-sm text-ink-muted">{k}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);
const Kartu = ({ judul, children }: { judul: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4">
    <h2 className="mb-3 text-lg font-semibold">{judul}</h2>
    {children}
  </section>
);

/** Pesan pembeli di kiri, pesan admin di kanan berlatar oranye lembut; nama pengirim + peran + waktu WIB. */
function Pesan({ m, pembeli }: { m: TicketMessage; pembeli: string }) {
  const admin = m.sender_role === "admin";
  return (
    <li className={cx("flex flex-col gap-1", admin ? "items-end" : "items-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-lg border px-4 py-3",
          admin ? "border-primary-soft bg-primary-soft" : "border-line bg-subtle",
        )}
      >
        <p className="text-sm">
          <span className="font-semibold text-ink">{m.sender_name ?? (admin ? "Admin" : pembeli)}</span>
          <span className="text-ink-muted"> · {SENDER_LABELS[m.sender_role] ?? m.sender_role}</span>
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-ink">{m.body}</p>
      </div>
      <time dateTime={m.created_at} className="px-1 text-sm text-ink-muted">
        {waktuLengkap(m.created_at)}
      </time>
    </li>
  );
}

/** Detail tiket: info singkat, percakapan + formulir balas (bila belum ditutup), pembeli, dan pesanan terkait. */
export function TiketDetail({ t }: { t: TicketDetail }) {
  const ditutup = t.status === "closed";
  const pesanan = t.order && ticketOrderStatus(t.order.status);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-muted">
        <StatusTiket status={t.status} />
        <span className="font-mono font-semibold text-ink">{t.code}</span>
        <span>Kategori {categoryLabel(t.category)}</span>
        <span>Dibuat {waktuLengkap(t.created_at)}</span>
      </div>
      {ditutup && (
        <Banner tone="neutral">
          Tiket ditutup{t.closed_by ? ` oleh ${t.closed_by === "admin" ? "admin" : "pembeli"}` : ""}
          {t.closed_at ? ` pada ${waktuLengkap(t.closed_at)}` : ""}. Balasan tidak bisa dikirim lagi; pembeli membuat
          tiket baru bila masih perlu bantuan.
        </Banner>
      )}

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <section
          aria-labelledby="judul-percakapan"
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 lg:col-span-2"
        >
          <h2 id="judul-percakapan" className="text-lg font-semibold">
            Percakapan
          </h2>
          {t.messages.length === 0 ? (
            <p className="text-ink-muted">Belum ada pesan.</p>
          ) : (
            <ol aria-label="Pesan tiket" className="flex flex-col gap-4">
              {t.messages.map((m) => (
                <Pesan key={m.id} m={m} pembeli={t.customer.full_name} />
              ))}
            </ol>
          )}
          {!ditutup && <BalasTiket code={t.code} />}
        </section>

        <div className="flex flex-col gap-4">
          <Kartu judul="Pembeli">
            <dl className="flex flex-col gap-2">
              <Baris k="Nama">{t.customer.full_name}</Baris>
              <Baris k="WhatsApp">
                <a
                  href={whatsappLink(t.customer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {formatPhone(t.customer.phone)}
                </a>
              </Baris>
              <Baris k="Email">{t.customer.email ?? "—"}</Baris>
            </dl>
            <Link
              href={`/admin/tiket?status=semua&q=${encodeURIComponent(t.customer.phone)}`}
              className="mt-3 inline-flex min-h-11 items-center text-primary underline"
            >
              Tiket lain dari pembeli ini
            </Link>
          </Kartu>
          {t.order && pesanan && (
            <Kartu judul="Pesanan terkait">
              <dl className="flex flex-col gap-2">
                <Baris k="Kode">
                  <span className="font-mono">{t.order.code}</span>
                </Baris>
                <Baris k="Status">
                  <Badge tone={pesanan.tone} icon={pesanan.icon}>
                    {pesanan.label}
                  </Badge>
                </Baris>
                <Baris k="Total">
                  <span className="font-mono">{formatRupiah(t.order.total)}</span>
                </Baris>
                <Baris k="Toko">{t.order.merchant_name}</Baris>
                <Baris k="Dipesan">{waktuLengkap(t.order.created_at)}</Baris>
              </dl>
            </Kartu>
          )}
        </div>
      </div>
    </div>
  );
}
