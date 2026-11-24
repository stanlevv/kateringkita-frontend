"use client";

// Komponen RefreshOnOpen: memuat ulang data server sekali saat halaman dibuka, supaya layout admin ikut dirender
// ulang. Dipakai halaman detail laporan chat: membukanya menandai laporan sudah dibuka di backend, sedangkan lencana
// "Chat dilaporkan" di menu berasal dari layout yang tidak dirender ulang saat navigasi di sisi klien.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Memanggil `router.refresh()` sekali setelah tampil. Tidak merender apa pun.
 * @returns null
 */
export function RefreshOnOpen() {
  const router = useRouter();
  useEffect(() => {
    // Sekali per halaman dibuka: refresh tidak memasang ulang komponen ini, dan router dari Next tetap sama.
    router.refresh();
  }, [router]);
  return null;
}
