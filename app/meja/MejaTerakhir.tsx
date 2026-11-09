"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { langganan, mejaTerakhir } from "@/lib/meja-simpan";
import { MejaPesan } from "./MejaPesan";

export function MejaTerakhir() {
  const router = useRouter();
  // undefined = render server (belum tahu), null = belum pernah scan
  const meja = useSyncExternalStore(langganan, mejaTerakhir, () => undefined);
  useEffect(() => {
    if (meja) router.replace(`/meja/${meja}`);
  }, [meja, router]);
  return meja === null ? <MejaPesan judul="Scan QR di meja" isi="Arahkan kamera HP ke QR yang tertempel di meja untuk melihat menu dan memesan." /> : null;
}
