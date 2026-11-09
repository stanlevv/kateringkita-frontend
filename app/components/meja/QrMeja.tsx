"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { Meja } from "@/types/meja";

// F21: QR berisi alamat menu meja di web ini; dibuat di peramban agar token tidak dikirim ke layanan QR pihak luar
export const urlMeja = (token: string) => `${window.location.origin}/meja/${token}`;
export const gambarQr = (token: string, width = 512) =>
  QRCode.toDataURL(urlMeja(token), { width, margin: 1, color: { dark: "#262017", light: "#FFFFFF" } });

export function QrMeja({ meja, ukuran = 144 }: { meja: Meja; ukuran?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    gambarQr(meja.token).then(setSrc, () => setSrc(null));
  }, [meja.token]);
  return src
    ? <Image src={src} alt={`QR Meja ${meja.label}`} width={ukuran} height={ukuran} unoptimized />
    : <div aria-hidden className="animate-pulse rounded-md bg-subtle" style={{ width: ukuran, height: ukuran }} />;
}
