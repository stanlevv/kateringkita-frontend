"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, TriangleAlert, X } from "lucide-react";
import { uploadPhoto } from "@/lib/upload";
import { Button } from "@/app/components/ui/Button";
import { FileDrop } from "@/app/components/ui/FileDrop";

export const MAX_EXTRA_PHOTOS = 4;
const MEGABYTE = 1024 * 1024;

/** Foto tambahan menu (selain foto utama): unggah satu per satu, geser urutan, hapus. Urutan = urutan tampil di aplikasi. */
export function ExtraPhotos({
  urls,
  onChange,
  onBusy,
  error,
}: {
  urls: string[];
  onChange: (nextUrls: string[]) => void;
  onBusy: (busy: boolean) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadToken = useRef(0); // respons unggahan lama diabaikan bila komponen dilepas
  useEffect(
    () => () => {
      uploadToken.current++;
    },
    [],
  );
  const isFull = urls.length >= MAX_EXTRA_PHOTOS;

  async function uploadFile(file: File) {
    const token = ++uploadToken.current;
    setUploadError(null);
    setUploading(true);
    onBusy(true);
    const result = await uploadPhoto(file, "menu");
    if (token !== uploadToken.current) return;
    setUploading(false);
    onBusy(false);
    if ("error" in result) return setUploadError(result.error.message);
    onChange([...urls, result.data.public_url]);
  }
  const move = (i: number, direction: -1 | 1) => {
    const reordered = [...urls];
    [reordered[i], reordered[i + direction]] = [reordered[i + direction], reordered[i]];
    onChange(reordered);
  };
  const message = uploadError ?? error;

  return (
    <div role="group" aria-label="Foto tambahan" className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Maksimal {MAX_EXTRA_PHOTOS} foto lagi, misalnya isi kotak, porsi, atau kemasan. Pembeli menggeser foto di
        halaman menu.
      </p>
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li key={url} className="flex flex-col gap-1">
              <div className="relative aspect-square overflow-hidden rounded-md bg-subtle">
                <Image
                  src={url}
                  alt={`Foto tambahan ${i + 1}`}
                  fill
                  unoptimized
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  aria-label={`Geser foto ${i + 1} ke kiri`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowLeft aria-hidden className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Hapus foto tambahan ${i + 1}`}
                  onClick={() => onChange(urls.filter((_, j) => j !== i))}
                >
                  <X aria-hidden className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Geser foto ${i + 1} ke kanan`}
                  disabled={i === urls.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {uploading && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Mengunggah foto…
        </p>
      )}
      {message && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {message}
        </p>
      )}
      {!isFull && !uploading && (
        <FileDrop
          id="mf-gallery"
          maxBytes={20 * MEGABYTE /* diperkecil di lib/upload.ts */}
          onFile={(file) => void uploadFile(file)}
          onError={setUploadError}
          label="Tambah foto"
        />
      )}
    </div>
  );
}
