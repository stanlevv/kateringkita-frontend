import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
import { Banner } from "@/app/components/ui/Banner";
import { cx } from "@/app/components/ui/cx";
import { formatRupiah, formatPhone } from "@/lib/format";
import { whatsappLink } from "@/services/admin-merchant.service";
import { SENDER_LABELS, categoryLabel, ticketOrderStatus } from "@/services/admin-ticket.service";
import type { TicketDetail, TicketMessage } from "@/types/admin";
import { TicketReplyForm } from "./TicketReplyForm";
import { TicketStatusBadge, formatFullTime } from "./TicketStatusBadge";

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col">
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4">
    <h2 className="mb-3 text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

/** Pesan pembeli di kiri, pesan admin di kanan berlatar oranye lembut; nama pengirim + peran + waktu WIB. */
function MessageBubble({ message, customerName }: { message: TicketMessage; customerName: string }) {
  const fromAdmin = message.sender_role === "admin";
  return (
    <li className={cx("flex flex-col gap-1", fromAdmin ? "items-end" : "items-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-lg border px-4 py-3",
          fromAdmin ? "border-primary-soft bg-primary-soft" : "border-line bg-subtle",
        )}
      >
        <p className="text-sm">
          <span className="font-semibold text-ink">{message.sender_name ?? (fromAdmin ? "Admin" : customerName)}</span>
          <span className="text-ink-muted"> · {SENDER_LABELS[message.sender_role] ?? message.sender_role}</span>
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-ink">{message.body}</p>
      </div>
      <time dateTime={message.created_at} className="px-1 text-sm text-ink-muted">
        {formatFullTime(message.created_at)}
      </time>
    </li>
  );
}

/** Detail tiket: info singkat, percakapan + formulir balas (bila belum ditutup), pembeli, dan pesanan terkait. */
export function TicketDetailView({ ticket }: { ticket: TicketDetail }) {
  const closed = ticket.status === "closed";
  const orderStatus = ticket.order && ticketOrderStatus(ticket.order.status);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-muted">
        <TicketStatusBadge status={ticket.status} />
        <span className="font-mono font-semibold text-ink">{ticket.code}</span>
        <span>Kategori {categoryLabel(ticket.category)}</span>
        <span>Dibuat {formatFullTime(ticket.created_at)}</span>
      </div>
      {closed && (
        <Banner tone="neutral">
          Tiket ditutup{ticket.closed_by ? ` oleh ${ticket.closed_by === "admin" ? "admin" : "pembeli"}` : ""}
          {ticket.closed_at ? ` pada ${formatFullTime(ticket.closed_at)}` : ""}. Balasan tidak bisa dikirim lagi;
          pembeli membuat tiket baru bila masih perlu bantuan.
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
          {ticket.messages.length === 0 ? (
            <p className="text-ink-muted">Belum ada pesan.</p>
          ) : (
            <ol aria-label="Pesan tiket" className="flex flex-col gap-4">
              {ticket.messages.map((message) => (
                <MessageBubble key={message.id} message={message} customerName={ticket.customer.full_name} />
              ))}
            </ol>
          )}
          {!closed && <TicketReplyForm code={ticket.code} />}
        </section>

        <div className="flex flex-col gap-4">
          <SectionCard title="Pembeli">
            <dl className="flex flex-col gap-2">
              <DetailRow label="Nama">{ticket.customer.full_name}</DetailRow>
              <DetailRow label="WhatsApp">
                <a
                  href={whatsappLink(ticket.customer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {formatPhone(ticket.customer.phone)}
                </a>
              </DetailRow>
              <DetailRow label="Email">{ticket.customer.email ?? "—"}</DetailRow>
            </dl>
            <Link
              href={`/admin/tiket?status=semua&q=${encodeURIComponent(ticket.customer.phone)}`}
              className="mt-3 inline-flex min-h-11 items-center text-primary underline"
            >
              Tiket lain dari pembeli ini
            </Link>
          </SectionCard>
          {ticket.order && orderStatus && (
            <SectionCard title="Pesanan terkait">
              <dl className="flex flex-col gap-2">
                <DetailRow label="Kode">
                  <span className="font-mono">{ticket.order.code}</span>
                </DetailRow>
                <DetailRow label="Status">
                  <Badge tone={orderStatus.tone} icon={orderStatus.icon}>
                    {orderStatus.label}
                  </Badge>
                </DetailRow>
                <DetailRow label="Total">
                  <span className="font-mono">{formatRupiah(ticket.order.total)}</span>
                </DetailRow>
                <DetailRow label="Toko">{ticket.order.merchant_name}</DetailRow>
                <DetailRow label="Dipesan">{formatFullTime(ticket.order.created_at)}</DetailRow>
              </dl>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
