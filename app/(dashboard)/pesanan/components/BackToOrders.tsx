// Komponen BackToOrders: tautan "Kembali ke daftar pesanan". Dipakai /pesanan/[code] dan kerangka memuatnya.
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Tautan kembali ke /pesanan. Dipakai juga di kerangka memuat supaya tetap bisa diklik selama detail dimuat.
 * @returns elemen Link
 */
export function BackToOrders() {
  return (
    <Link
      href="/pesanan"
      className="mb-4 inline-flex min-h-11 items-center gap-1 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-focus"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Kembali ke daftar pesanan
    </Link>
  );
}
