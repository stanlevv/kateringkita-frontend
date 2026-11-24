// Komponen QueueTiles: bagian "Perlu tindakan" di halaman /admin (Dashboard). Ubin hitungan antrean yang menunggu admin,
// masing-masing menaut ke halaman antreannya dengan filter bawaannya.
// Server component: hanya menampilkan data yang dikirim halaman (GET /admin/queues).
import Link from "next/link";
import { BadgeCheck, Banknote, LifeBuoy, MessageCircle, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { focusRing } from "@/app/components/ui/cx";
import { KpiCard } from "@/app/components/ui/KpiCard";
import type { AdminQueues } from "@/types/admin";

// Gaya tautan pembungkus ubin (dengan cincin fokus keyboard), sama dengan ubin penjual di SummaryCards.
const TILE_LINK_CLASS = `block rounded-lg ${focusRing}`;

/**
 * Ubin "Perlu tindakan": hitungan antrean dengan tautan ke halaman antreannya. Ikon sama dengan menunya di nav.ts.
 * Ubin bernilai null (Pencairan untuk admin bukan super) dibuang; ubin bernilai 0 tetap tampil.
 * @param props.queues hitungan antrean dari backend, atau null bila gagal dimuat
 * @returns section berjudul "Perlu tindakan"
 */
export function QueueTiles({ queues }: { queues: AdminQueues | null }) {
  const tiles: { label: string; href: string; icon: LucideIcon; value: number | null; hint?: string }[] = queues
    ? [
        {
          label: "Verifikasi penjual",
          href: "/admin/verifikasi",
          icon: ShieldCheck,
          value: queues.merchants_pending,
        },
        {
          label: "Tiket menunggu balasan",
          href: "/admin/tiket?status=open",
          icon: LifeBuoy,
          value: queues.tickets_open,
        },
        {
          label: "Laporan chat belum dibuka",
          href: "/admin/chat-dilaporkan",
          icon: MessageCircle,
          value: queues.chats_reported,
        },
        {
          label: "Pencairan",
          href: "/admin/pencairan",
          icon: Banknote,
          // Kedua angka uang null bersamaan bila admin bukan super.
          value: queues.payouts_pending === null ? null : queues.payouts_pending + (queues.refunds_pending ?? 0),
          hint: `${queues.payouts_pending} toko siap dicairkan · ${queues.refunds_pending ?? 0} refund menunggu`,
        },
        {
          label: "Hasil AI menunggu",
          href: "/admin/hasil-ai?status=menunggu",
          icon: BadgeCheck,
          value: queues.ai_results_pending,
        },
      ]
    : [];
  return (
    <section aria-label="Perlu tindakan">
      <h2 className="mb-3 text-lg font-semibold text-ink">Perlu tindakan</h2>
      {queues ? (
        <ul className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {tiles
            .filter((tile) => tile.value !== null)
            .map(({ label, href, icon, value, hint }) => (
              <li key={href}>
                <Link href={href} className={TILE_LINK_CLASS}>
                  <KpiCard icon={icon} label={label} value={value} hint={hint} />
                </Link>
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-ink-muted">Antrean belum bisa dimuat.</p>
      )}
    </section>
  );
}
