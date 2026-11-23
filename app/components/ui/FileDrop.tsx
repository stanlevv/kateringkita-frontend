"use client";

import { useRef, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { cx, focusRing } from "./cx";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function FileDrop({
  accept = ACCEPTED_TYPES,
  maxBytes,
  onFile,
  onError,
  label = "Pilih foto",
  id,
}: {
  accept?: string[];
  maxBytes: number;
  onFile: (file: File) => void;
  onError: (message: string) => void;
  label?: string;
  id?: string;
}) {
  const input = useRef<HTMLInputElement>(null);

  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!accept.includes(file.type)) return onError("Format foto harus JPG, PNG, atau WebP.");
    if (file.size > maxBytes) return onError(`Ukuran foto maksimal ${Math.round(maxBytes / (1024 * 1024))} MB.`);
    onFile(file);
  };
  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="rounded-md border border-dashed border-line-strong bg-subtle p-4"
    >
      <button
        id={id}
        type="button"
        onClick={() => input.current?.click()}
        className={cx(
          "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md font-medium text-ink",
          focusRing,
        )}
      >
        <ImagePlus aria-hidden className="size-5" />
        {label}
      </button>
      <p className="mt-1 text-center text-sm text-ink-muted">atau seret foto ke sini. JPG, PNG, atau WebP.</p>
      <input
        ref={input}
        type="file"
        accept={accept.join(",")}
        hidden
        tabIndex={-1}
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
