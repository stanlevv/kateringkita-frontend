"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, ImageOff, Megaphone } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { cx } from "@/app/components/ui/cx";
import { formatTime, formatDate } from "@/lib/format";
import type { AppNotification } from "@/types/notification";

const LIMIT = 20;
const TYPE_ICONS = { moderation: ImageOff, info: Megaphone } as const;

/** Daftar notifikasi; yang belum dibaca ditandai titik. Saat dibuka semua ditandai dibaca, lalu badge sidebar disegarkan. */
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
  const router = useRouter();
  const markedRead = useRef(false);
  useEffect(() => {
    if (unread === 0 || markedRead.current) return;
    markedRead.current = true;
    void markAllNotificationsRead().then((result) => {
      if ("data" in result) router.refresh();
    });
  }, [unread, router]);

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
                  {notification.title}
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
