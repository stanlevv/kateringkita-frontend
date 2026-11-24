// Komponen LastTable (isi halaman /meja): membuka meja yang terakhir dipindai, atau menampilkan petunjuk dan tombol
// pindai QR bila belum pernah. Token meja terakhir dibaca dari localStorage (penyimpanan kecil di peramban, lihat
// lib/table-storage.ts) lewat useSyncExternalStore, hook React untuk membaca data di luar React.
// "use client": komponen ini berjalan di peramban (client component) karena membaca localStorage dan URL.
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { subscribe, readLastTable } from "@/lib/table-storage";
import { TableMessage } from "./TableMessage";
import { QrScanner } from "./QrScanner";

// URL tidak berubah selama komponen tampil, jadi tidak ada yang perlu didengarkan.
const subscribeNever = () => () => {};
// ?pindai=1 dari tombol "Scan meja lain": jangan lompat ke meja terakhir
const isScanRequested = () => new URLSearchParams(window.location.search).has("pindai");

/**
 * Isi halaman /meja. Saat render di server belum diketahui apa isi localStorage, jadi tidak menampilkan apa-apa dulu.
 * @returns null saat belum tahu atau saat sedang dialihkan; selain itu TableMessage dengan QrScanner
 */
export function LastTable() {
  // 1. Baca token meja terakhir dan permintaan ?pindai. undefined = render di server (belum tahu), null = belum pernah
  //    memindai.
  const router = useRouter();
  const lastTableToken = useSyncExternalStore(subscribe, readLastTable, () => undefined);
  const scanRequested = useSyncExternalStore(subscribeNever, isScanRequested, () => false);
  // 2. Pernah memindai dan tidak sedang diminta memindai -> pindah ke menu meja itu (replace: tidak menambah riwayat
  //    Back).
  useEffect(() => {
    if (lastTableToken && !scanRequested) router.replace(`/meja/${lastTableToken}`);
  }, [lastTableToken, scanRequested, router]);
  // 3. Belum tahu atau sedang dialihkan -> kosong; selain itu tampilkan petunjuk dan pemindai.
  if (lastTableToken === undefined || (lastTableToken && !scanRequested)) return null;
  return (
    <TableMessage
      title="Scan QR di meja"
      body="Scan QR yang tertempel di meja untuk melihat menu dan memesan."
      action={<QrScanner />}
    />
  );
}
