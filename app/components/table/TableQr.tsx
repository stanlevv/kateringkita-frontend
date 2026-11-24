// Komponen TableQr: gambar QR untuk satu meja (pesan dari meja). Dipakai Pengaturan > Pesan dari meja dan /cetak-qr.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { Table } from "@/types/table";

// QR berisi alamat menu meja di web ini. Gambar dibuat di peramban supaya token meja tidak dikirim ke layanan QR
// pihak luar.

/**
 * Alamat halaman menu meja di web ini.
 * @param token token rahasia meja
 * @returns URL lengkap `<origin>/meja/<token>`
 */
export const tableUrl = (token: string) => `${window.location.origin}/meja/${token}`;
/**
 * Membuat gambar QR alamat meja sebagai data URL PNG (dipakai juga untuk tombol unduh QR).
 * @param token token rahasia meja
 * @param width lebar gambar dalam piksel (bawaan 512)
 * @returns Promise berisi data URL gambar
 */
export const createTableQrImage = (token: string, width = 512) =>
  QRCode.toDataURL(tableUrl(token), { width, margin: 1, color: { dark: "#262017", light: "#FFFFFF" } });

/**
 * Gambar QR satu meja. Selama gambar dibuat, tampil kotak abu-abu berkedip seukuran QR.
 * @param props.table data meja (token dan label)
 * @param props.size ukuran tampil dalam piksel (bawaan 144)
 * @returns elemen Image, atau kotak pengganti selama gambar dibuat
 */
export function TableQr({ table, size = 144 }: { table: Table; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    createTableQrImage(table.token).then(setSrc, () => setSrc(null));
  }, [table.token]);
  return src ? (
    <Image src={src} alt={`QR Meja ${table.label}`} width={size} height={size} unoptimized />
  ) : (
    <div aria-hidden className="animate-pulse rounded-md bg-subtle" style={{ width: size, height: size }} />
  );
}
