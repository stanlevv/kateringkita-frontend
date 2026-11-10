import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Tautan kembali di detail pesanan; dipakai juga oleh kerangka memuatnya supaya tetap bisa diklik selama memuat. */
export function KembaliKePesanan() {
  return (
    <Link href="/pesanan" className="mb-4 inline-flex min-h-11 items-center gap-1 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-focus">
      <ChevronLeft aria-hidden className="size-4" />Kembali ke daftar pesanan
    </Link>
  );
}
