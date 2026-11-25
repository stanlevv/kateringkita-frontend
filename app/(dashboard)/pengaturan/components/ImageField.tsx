// Isian logo atau background toko (pratinjau, unggah langsung, hapus). Dipakai SettingsForm.tsx.
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { cx } from "@/app/components/ui/cx";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { uploadPhoto } from "@/lib/upload";

const MEGABYTE = 1024 * 1024;

/** Tampilan per jenis gambar: nama, ukuran bingkai, cara gambar mengisi bingkai, dan ukuran untuk next/image. */
const IMAGE_KINDS = {
  logo: { name: "Logo toko", frameClass: "aspect-square w-40", fitClass: "object-contain", sizes: "160px" },
  // background profil toko tampil melebar di atas halaman toko aplikasi
  cover: {
    name: "Background toko",
    frameClass: "aspect-[3/1] w-full max-w-md",
    fitClass: "object-cover",
    sizes: "448px",
  },
} as const;

/**
 * Isian logo atau background toko: pratinjau, unggah langsung dari peramban ke penyimpanan, dan hapus. Selama
 * unggahan berjalan, induk diberi tahu lewat onBusy supaya tombol Simpan menunggu. (Unggah gambar QRIS toko sudah
 * dihapus karena pembayaran online lewat Midtrans.)
 * @param props.id id isian, dipakai tautan ringkasan galat
 * @param props.kind "logo" atau "cover" (juga jenis unggahan di lib/upload.ts)
 * @param props.url alamat gambar sekarang, null bila belum ada
 * @param props.error galat dari validasi formulir
 * @param props.onChange dipanggil dengan alamat baru, atau null saat dihapus
 * @param props.onBusy dipanggil true saat unggah mulai dan false saat selesai atau batal
 * @returns grup isian gambar
 */
export function ImageField({
  id,
  kind = "logo",
  url,
  error,
  onChange,
  onBusy,
}: {
  id: string;
  kind?: keyof typeof IMAGE_KINDS;
  url: string | null;
  error?: string;
  onChange: (newUrl: string | null) => void;
  onBusy: (busy: boolean) => void;
}) {
  // 1. Tampilan jenis gambar dan state unggahan. uploadToken menandai unggahan terbaru, jadi respons lama diabaikan.
  const imageKind = IMAGE_KINDS[kind];
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const uploadToken = useRef(0); // token unggahan terbaru; respons lama diabaikan
  const uploadRunning = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  // 2. Tombol Hapus hilang bersama gambar; fokus dipindah ke tombol pilih berkas.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    container.current?.querySelector("button")?.focus();
  }, [url]);
  // 3. Pindah ke bagian lain (Hapus, pilih ulang, atau form direset): unggahan yang masih jalan dibatalkan.
  function cancelUpload() {
    uploadToken.current++;
    if (uploadRunning.current) {
      uploadRunning.current = false;
      setUploading(false);
      onBusy(false);
    }
  }
  // 4. Saat isian dilepas (form direset dengan key baru), respons unggahan yang masih berjalan diabaikan.
  useEffect(
    () => () => {
      uploadToken.current++;
    },
    [],
  ); // form direset (key baru): respons lama diabaikan
  // 5. Unggah berkas yang dipilih.
  async function chooseFile(file: File) {
    // 1. Batalkan unggahan sebelumnya dan catat token unggahan ini.
    cancelUpload();
    const token = uploadToken.current;
    setUploadError(null);
    setUploaded(false);
    uploadRunning.current = true;
    setUploading(true);
    onBusy(true);
    // 2. Unggah; hasil diabaikan bila sudah ada unggahan yang lebih baru atau unggahan dibatalkan.
    const result = await uploadPhoto(file, kind);
    if (token !== uploadToken.current) return;
    uploadRunning.current = false;
    setUploading(false);
    onBusy(false);
    if ("error" in result) return setUploadError(result.error.message);
    setUploaded(true);
    onChange(result.data.public_url);
  }
  const message = uploadError ?? error;
  return (
    <div role="group" aria-label={imageKind.name} className="flex flex-col gap-3">
      {url ? (
        <div className={cx("relative overflow-hidden rounded-md bg-subtle", imageKind.frameClass)}>
          <Image
            src={url}
            alt={imageKind.name}
            fill
            unoptimized
            sizes={imageKind.sizes}
            className={imageKind.fitClass}
          />
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Belum ada gambar.</p>
      )}
      {uploading && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Mengunggah…
        </p>
      )}
      {uploaded && !uploading && (
        <p role="status" className="text-sm text-success">
          {kind === "logo" ? "Logo" : "Background"} terunggah.
        </p>
      )}
      {message && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert aria-hidden className="size-4" />
          {message}
        </p>
      )}
      <div ref={container}>
        <FileDrop
          id={id}
          maxBytes={20 * MEGABYTE /* diperkecil di lib/upload.ts */}
          onFile={(file) => void chooseFile(file)}
          onError={setUploadError}
          label={`${url ? "Ganti" : "Pilih"} ${kind === "logo" ? "logo" : "background"}`}
        />
      </div>
      {url && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              cancelUpload();
              moveFocus.current = true;
              setUploadError(null);
              setUploaded(false);
              onChange(null);
            }}
          >
            <X aria-hidden className="size-4" />
            Hapus gambar
          </Button>
        </div>
      )}
    </div>
  );
}
