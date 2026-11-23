"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, TriangleAlert, X } from "lucide-react";
import { uploadPhoto } from "@/lib/upload";
import { Button } from "@/app/components/ui/Button";
import { FileDrop } from "@/app/components/ui/FileDrop";

export const MAKS_FOTO_TAMBAHAN = 4;
const MB = 1024 * 1024;

/** Foto tambahan menu (selain foto utama): unggah satu per satu, geser urutan, hapus. Urutan = urutan tampil di aplikasi. */
export function FotoTambahan({
  urls,
  onChange,
  onBusy,
  error,
}: {
  urls: string[];
  onChange: (u: string[]) => void;
  onBusy: (b: boolean) => void;
  error?: string;
}) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const unggahKe = useRef(0); // respons unggahan lama diabaikan bila komponen dilepas
  useEffect(
    () => () => {
      unggahKe.current++;
    },
    [],
  );
  const penuh = urls.length >= MAKS_FOTO_TAMBAHAN;

  async function pilih(f: File) {
    const id = ++unggahKe.current;
    setGalat(null);
    setSibuk(true);
    onBusy(true);
    const r = await uploadPhoto(f, "menu");
    if (id !== unggahKe.current) return;
    setSibuk(false);
    onBusy(false);
    if ("error" in r) return setGalat(r.error.message);
    onChange([...urls, r.data.public_url]);
  }
  const geser = (i: number, arah: -1 | 1) => {
    const l = [...urls];
    [l[i], l[i + arah]] = [l[i + arah], l[i]];
    onChange(l);
  };
  const pesan = galat ?? error;

  return (
    <div role="group" aria-label="Foto tambahan" className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Maksimal {MAKS_FOTO_TAMBAHAN} foto lagi, misalnya isi kotak, porsi, atau kemasan. Pembeli menggeser foto di
        halaman menu.
      </p>
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((u, i) => (
            <li key={u} className="flex flex-col gap-1">
              <div className="relative aspect-square overflow-hidden rounded-md bg-subtle">
                <Image src={u} alt={`Foto tambahan ${i + 1}`} fill unoptimized sizes="160px" className="object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  aria-label={`Geser foto ${i + 1} ke kiri`}
                  disabled={i === 0}
                  onClick={() => geser(i, -1)}
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
                  onClick={() => geser(i, 1)}
                >
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sibuk && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Mengunggah foto…
        </p>
      )}
      {pesan && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {pesan}
        </p>
      )}
      {!penuh && !sibuk && (
        <FileDrop
          id="mf-gallery"
          maxBytes={20 * MB /* diperkecil di lib/upload.ts */}
          onFile={(f) => void pilih(f)}
          onError={setGalat}
          label="Tambah foto"
        />
      )}
    </div>
  );
}
