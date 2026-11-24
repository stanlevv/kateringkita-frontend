// Komponen UnreadChatList: daftar pesanan yang punya pesan pembeli belum dibaca ("Chat belum dibalas") di halaman
// /pesanan?chat=belum-dibalas. Data dari GET /merchant/chats/unread lewat page.tsx; tiap baris membuka detail pesanan.
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { focusRing } from "@/app/components/ui/cx";
import { formatDate, formatTime } from "@/lib/format";
import type { UnreadChats } from "@/types/order-chat";

/**
 * Daftar chat belum dibalas, terbaru dulu. Baris berisi kode pesanan, jumlah pesan baru, dan waktu pesan terakhir.
 * @param props.chats ringkasan chat belum dibaca, atau null bila gagal dimuat
 * @returns layar gagal muat, keadaan kosong, atau daftar tautan ke detail pesanan
 */
export function UnreadChatList({ chats }: { chats: UnreadChats | null }) {
  if (!chats)
    return (
      <LoadError
        title="Chat belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil daftar chat. Periksa koneksi lalu coba lagi."
      />
    );
  if (chats.orders.length === 0)
    return (
      <EmptyState
        icon={MessageCircle}
        title="Semua chat sudah dibalas"
        body="Pesan baru dari pembeli akan muncul di sini."
      />
    );
  return (
    <ul aria-label="Chat belum dibalas" className="flex flex-col gap-3">
      {chats.orders.map((order) => (
        <li key={order.code}>
          <Link
            href={`/pesanan/${encodeURIComponent(order.code)}`}
            className={`flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-4 hover:bg-subtle ${focusRing}`}
          >
            <span className="font-mono font-semibold text-ink">{order.code}</span>
            <span className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-warning-bg px-2 font-bold text-warning">
                {order.unread_count} pesan baru
              </span>
              <span className="font-mono text-ink-muted">
                {formatDate(order.last_message_at)} {formatTime(order.last_message_at)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
