"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { Table } from "@/types/table";

// F21: QR berisi alamat menu meja di web ini; dibuat di peramban agar token tidak dikirim ke layanan QR pihak luar
export const tableUrl = (token: string) => `${window.location.origin}/meja/${token}`;
export const createTableQrImage = (token: string, width = 512) =>
  QRCode.toDataURL(tableUrl(token), { width, margin: 1, color: { dark: "#262017", light: "#FFFFFF" } });

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
