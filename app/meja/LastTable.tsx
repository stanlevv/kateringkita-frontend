"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { subscribe, readLastTable } from "@/lib/table-storage";
import { MejaPesan } from "./TableMessage";
import { PindaiQr } from "./QrScanner";

const tanpaLangganan = () => () => {};
// ?pindai=1 dari tombol "Scan meja lain": jangan lompat ke meja terakhir
const mintaPindai = () => new URLSearchParams(window.location.search).has("pindai");

export function MejaTerakhir() {
  const router = useRouter();
  // undefined = render server (belum tahu), null = belum pernah scan
  const meja = useSyncExternalStore(subscribe, readLastTable, () => undefined);
  const pindai = useSyncExternalStore(tanpaLangganan, mintaPindai, () => false);
  useEffect(() => {
    if (meja && !pindai) router.replace(`/meja/${meja}`);
  }, [meja, pindai, router]);
  if (meja === undefined || (meja && !pindai)) return null;
  return (
    <MejaPesan
      judul="Scan QR di meja"
      isi="Scan QR yang tertempel di meja untuk melihat menu dan memesan."
      aksi={<PindaiQr />}
    />
  );
}
