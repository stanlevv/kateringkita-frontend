// Komponen Dialog: jendela modal memakai elemen <dialog> bawaan peramban (fokus terkunci di dalam, Esc menutup).
// Dasar ConfirmDialog dan Drawer; dipakai juga langsung di form admin.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

/**
 * Jendela modal berjudul dengan tombol Tutup. Saat ditutup, fokus kembali ke elemen yang membukanya.
 * @param props.open tampil atau tidak
 * @param props.onClose dipanggil saat pengguna menutup (tombol Tutup atau Esc); induk yang mengubah `open`
 * @param props.title judul (juga nama dialog untuk pembaca layar lewat aria-labelledby)
 * @param props.children isi dialog
 * @param props.className kelas tambahan (mis. bentuk panel di Drawer)
 * @returns elemen `dialog`
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  // 1. Ref ke elemen <dialog> dan id judul untuk aria-labelledby.
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // 2. Buka sebagai modal saat `open`; saat ditutup/dilepas, tutup dan kembalikan fokus ke pembuka.
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc: biarkan induk yang menutup agar state tetap satu sumber.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cx(
        "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-ink/50",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <IconButton icon={X} label="Tutup" onClick={onClose} className="-mr-2 -mt-2" />
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
