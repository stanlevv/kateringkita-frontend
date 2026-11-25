// Isian foto utama menu: pratinjau, status unggah, galat, pilih berkas, dan hapus. Dipakai MenuForm.tsx, yang
// memegang state dan logika unggahnya.
"use client";

import Image from "next/image";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { MEGABYTE, type PhotoUpload } from "./menu-form-values";

/**
 * Blok foto utama di bagian "Foto" formulir menu.
 * @param props.displayedPhoto alamat pratinjau yang ditampilkan, null bila belum ada foto
 * @param props.photo unggahan foto yang sedang berjalan atau gagal, null bila tidak ada
 * @param props.imageError galat validasi image_url dari formulir
 * @param props.photoError galat pemilihan berkas
 * @param props.canUploadPhoto `false` menyembunyikan pilih berkas (admin tidak bisa mengunggah)
 * @param props.onRetry dipanggil saat tombol "Coba unggah lagi" ditekan
 * @param props.onSelect dipanggil dengan berkas yang dipilih
 * @param props.onError dipanggil dengan pesan galat pemilihan berkas
 * @param props.onRemove dipanggil saat tombol "Hapus foto" ditekan
 * @returns pratinjau, status, galat, pilih berkas, dan tombol hapus
 */
export function MenuPhotoField({
  displayedPhoto,
  photo,
  imageError,
  photoError,
  canUploadPhoto,
  onRetry,
  onSelect,
  onError,
  onRemove,
}: {
  displayedPhoto: string | null | undefined;
  photo: PhotoUpload | null;
  imageError: string | undefined;
  photoError: string | null;
  canUploadPhoto: boolean;
  onRetry: () => void;
  onSelect: (file: File) => void;
  onError: (message: string) => void;
  onRemove: () => void;
}) {
  return (
    <>
      {displayedPhoto && (
        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-md bg-subtle">
          <Image
            src={displayedPhoto}
            alt="Pratinjau foto menu"
            fill
            unoptimized
            sizes="384px"
            className="object-cover"
          />
        </div>
      )}
      {photo?.status === "mengunggah" && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Mengunggah foto…
        </p>
      )}
      {photo?.status === "gagal" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-danger bg-danger-bg p-3 text-danger"
        >
          <p className="flex items-center gap-2">
            <TriangleAlert aria-hidden className="size-5" />
            {photo.message ?? "Foto gagal diunggah. Coba lagi"}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            Coba unggah lagi
          </Button>
        </div>
      )}
      {imageError && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {imageError}
        </p>
      )}
      {photoError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {photoError}
        </p>
      )}
      {!canUploadPhoto && <p className="text-sm text-ink-muted">Foto hanya bisa diunggah dari akun penjual.</p>}
      {/* foto HP besar diperkecil di lib/upload.ts sebelum diunggah (batas backend 5 MB) */}
      {canUploadPhoto && (
        <FileDrop
          id="mf-image_url"
          maxBytes={20 * MEGABYTE}
          onFile={onSelect}
          onError={onError}
          label={displayedPhoto ? "Ganti foto" : "Pilih foto"}
        />
      )}
      {displayedPhoto && (
        <div>
          <Button variant="ghost" onClick={onRemove}>
            <X aria-hidden className="size-4" />
            Hapus foto
          </Button>
        </div>
      )}
    </>
  );
}
