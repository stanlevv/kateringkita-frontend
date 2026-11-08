"use client";

import { useRef, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { cx, fokus } from "./cx";

const FORMAT = ["image/jpeg", "image/png", "image/webp"];

export function FileDrop({ accept = FORMAT, maxBytes, onFile, onError, label = "Pilih foto", id }: { accept?: string[]; maxBytes: number; onFile: (f: File) => void; onError: (msg: string) => void; label?: string; id?: string }) {
  const input = useRef<HTMLInputElement>(null);

  const terima = (f?: File) => {
    if (!f) return;
    if (!accept.includes(f.type)) return onError("Format foto harus JPG, PNG, atau WebP.");
    if (f.size > maxBytes) return onError(`Ukuran foto maksimal ${Math.round(maxBytes / (1024 * 1024))} MB.`);
    onFile(f);
  };
  const lepas = (e: DragEvent) => { e.preventDefault(); terima(e.dataTransfer.files[0]); };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={lepas} className="rounded-md border border-dashed border-line-strong bg-subtle p-4">
      <button id={id} type="button" onClick={() => input.current?.click()} className={cx("inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md font-medium text-ink", fokus)}>
        <ImagePlus aria-hidden className="size-5" />
        {label}
      </button>
      <p className="mt-1 text-center text-sm text-ink-muted">atau seret foto ke sini. JPG, PNG, atau WebP.</p>
      <input ref={input} type="file" accept={accept.join(",")} hidden tabIndex={-1} onChange={(e) => { terima(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
