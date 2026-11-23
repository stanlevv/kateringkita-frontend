// Komponen FileDrop: pemilih foto lewat tombol atau seret-lepas, dengan cek format dan ukuran di peramban.
// Dipakai MenuForm, ExtraPhotos, SettingsForm, PopupList.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useRef, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { cx, focusRing } from "./cx";

// Format foto yang diterima (SVG ditolak karena bisa berisi skrip).
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Area pilih/seret foto. File yang lolos cek diteruskan ke `onFile`; yang gagal memanggil `onError` dengan pesan.
 * @param props.accept tipe MIME yang diterima (bawaan JPG, PNG, WebP)
 * @param props.maxBytes ukuran maksimal
 * @param props.onFile menerima file yang sah
 * @param props.onError menerima pesan galat
 * @param props.label teks tombol (bawaan "Pilih foto")
 * @param props.id id tombol (untuk label/ringkasan galat)
 * @returns elemen `div`
 */
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

  // 1. Cek format lalu ukuran; hanya file yang lolos diteruskan.
  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!accept.includes(file.type)) return onError("Format foto harus JPG, PNG, atau WebP.");
    if (file.size > maxBytes) return onError(`Ukuran foto maksimal ${Math.round(maxBytes / (1024 * 1024))} MB.`);
    onFile(file);
  };
  // 2. Seret-lepas: ambil file pertama dan cek seperti pilihan tombol.
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
