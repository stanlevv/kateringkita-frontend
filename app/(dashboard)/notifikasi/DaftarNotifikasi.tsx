"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, ImageOff, Megaphone } from "lucide-react";
import { tandaiSemuaDibaca } from "@/app/actions/notifikasi";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/ui/Pagination";
import { cx } from "@/app/components/ui/cx";
import { formatJam, formatTanggal } from "@/lib/format";
import type { Notifikasi } from "@/types/notifikasi";

const LIMIT = 20;
const IKON = { moderation: ImageOff, info: Megaphone } as const;

/** Daftar notifikasi; yang belum dibaca ditandai titik. Saat dibuka semua ditandai dibaca, lalu badge sidebar disegarkan. */
export function DaftarNotifikasi({
  rows,
  total,
  page,
  unread,
}: {
  rows: Notifikasi[];
  total: number;
  page: number;
  unread: number;
}) {
  const router = useRouter();
  const sudah = useRef(false);
  useEffect(() => {
    if (unread === 0 || sudah.current) return;
    sudah.current = true;
    void tandaiSemuaDibaca().then((r) => {
      if ("data" in r) router.refresh();
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
        {rows.map((n) => {
          const Ikon = IKON[n.type as keyof typeof IKON] ?? Bell;
          const baru = n.read_at === null;
          return (
            <li key={n.id} className={cx("flex gap-3 p-4", baru && "bg-primary-soft/40")}>
              <Ikon
                aria-hidden
                className={cx("mt-0.5 size-5 shrink-0", n.type === "moderation" ? "text-danger" : "text-ink-muted")}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {baru && (
                    <span className="size-2 shrink-0 rounded-full bg-accent">
                      <span className="sr-only">Belum dibaca: </span>
                    </span>
                  )}
                  {n.title}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-ink">{n.body}</p>
                <p className="text-xs text-ink-muted">
                  {formatTanggal(n.created_at)} · {formatJam(n.created_at)} WIB
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
          hrefFor={(p) => (p > 1 ? `/notifikasi?page=${p}` : "/notifikasi")}
        />
      )}
    </div>
  );
}
