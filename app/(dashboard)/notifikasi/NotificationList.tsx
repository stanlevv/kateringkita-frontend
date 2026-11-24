// Komponen NotificationList: daftar notifikasi penjual di /notifikasi dengan penanda belum dibaca dan paginasi;
// notifikasi pesan pembeli bertaut ke chat pesanannya.
// Data datang dari page.tsx; saat tampil, komponen memanggil server action markAllNotificationsRead
// (app/actions/notifications.ts) agar semua notifikasi ditandai dibaca.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ImageOff, Megaphone, MessagesSquare } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { cx, focusRing } from "@/app/components/ui/cx";
import { formatTime, formatDate } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

/** Jumlah notifikasi per halaman (sama dengan LIMIT_NOTIFICATIONS di service). */
const LIMIT = 20;
/** Ikon per jenis notifikasi (kunci = nilai `type` dari API); jenis lain memakai ikon lonceng. */
const TYPE_ICONS = { moderation: ImageOff, info: Megaphone, chat_message: MessagesSquare } as const;

/**
 * Tautan tujuan notifikasi: pesan pembeli (`chat_message`) membuka chat pesanannya.
 * @param notification notifikasi dari API
 * @returns alamat `/pesanan/<kode>#chat`, atau null bila notifikasi tidak punya tujuan atau `data` tidak terbaca
 */
function notificationHref(notification: AppNotification): string | null {
  // 1. Hanya pesan pembeli yang punya tujuan.
  if (notification.type !== "chat_message") return null;
  // 2. `data` bisa berupa objek atau teks JSON (kolom JSON di production kadang terkirim sebagai teks).
  let data: unknown = notification.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  // 3. Kode pesanan wajib teks yang tidak kosong.
  const orderCode = data && typeof data === "object" ? (data as Record<string, unknown>).order_code : undefined;
  return typeof orderCode === "string" && orderCode ? `/pesanan/${encodeURIComponent(orderCode)}#chat` : null;
}

/**
 * Daftar notifikasi; yang belum dibaca ditandai titik. Saat dibuka semua ditandai dibaca, lalu badge sidebar
 * disegarkan dengan router.refresh() (meminta ulang data server tanpa memuat ulang seluruh halaman).
 * @param props.rows notifikasi di halaman ini
 * @param props.total jumlah semua notifikasi (untuk paginasi)
 * @param props.page halaman sekarang
 * @param props.unread jumlah yang belum dibaca; 0 berarti tidak perlu memanggil server
 * @returns daftar notifikasi dan paginasi, atau EmptyState bila kosong
 */
export function NotificationList({
  rows,
  total,
  page,
  unread,
}: {
  rows: AppNotification[];
  total: number;
  page: number;
  unread: number;
}) {
  // 1. Tandai semua dibaca sekali saja per tampilan (ref mencegah panggilan ganda saat efek berjalan ulang).
  const router = useRouter();
  const markedRead = useRef(false);
  useEffect(() => {
    if (unread === 0 || markedRead.current) return;
    markedRead.current = true;
    void markAllNotificationsRead().then((result) => {
      if ("data" in result) router.refresh();
    });
  }, [unread, router]);

  // 2. Belum ada notifikasi sama sekali.
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Belum ada notifikasi"
        body="Pengumuman admin dan kabar tentang menu kamu akan muncul di sini."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {rows.map((notification) => {
          const Icon = TYPE_ICONS[notification.type as keyof typeof TYPE_ICONS] ?? Bell;
          const isNew = notification.read_at === null;
          const href = notificationHref(notification);
          return (
            <li key={notification.id} className={cx("flex gap-3 p-4", isNew && "bg-primary-soft/40")}>
              <Icon
                aria-hidden
                className={cx(
                  "mt-0.5 size-5 shrink-0",
                  notification.type === "moderation" ? "text-danger" : "text-ink-muted",
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {isNew && (
                    <span className="size-2 shrink-0 rounded-full bg-accent">
                      <span className="sr-only">Belum dibaca: </span>
                    </span>
                  )}
                  {href ? (
                    <Link href={href} className={cx("underline-offset-4 hover:underline", focusRing)}>
                      {notification.title}
                    </Link>
                  ) : (
                    notification.title
                  )}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-ink">{notification.body}</p>
                <p className="text-xs text-ink-muted">
                  {formatDate(notification.created_at)} · {formatTime(notification.created_at)} WIB
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {total > LIMIT && (
        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          hrefFor={(pageNumber) => (pageNumber > 1 ? `/notifikasi?page=${pageNumber}` : "/notifikasi")}
        />
      )}
    </div>
  );
}
