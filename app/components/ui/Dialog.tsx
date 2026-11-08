"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

export function Dialog({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const pembuka = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => {
      el.close();
      pembuka?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc: biarkan induk yang menutup agar state tetap satu sumber.
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className={cx("m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-ink/50", className)}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            <IconButton icon={X} label="Tutup" onClick={onClose} className="-mr-2 -mt-2" />
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
