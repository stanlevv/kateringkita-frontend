"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { subscribe, readLastTable } from "@/lib/table-storage";
import { TableMessage } from "./TableMessage";
import { QrScanner } from "./QrScanner";

const subscribeNever = () => () => {};
// ?pindai=1 dari tombol "Scan meja lain": jangan lompat ke meja terakhir
const isScanRequested = () => new URLSearchParams(window.location.search).has("pindai");

export function LastTable() {
  const router = useRouter();
  // undefined = render server (belum tahu), null = belum pernah scan
  const lastTableToken = useSyncExternalStore(subscribe, readLastTable, () => undefined);
  const scanRequested = useSyncExternalStore(subscribeNever, isScanRequested, () => false);
  useEffect(() => {
    if (lastTableToken && !scanRequested) router.replace(`/meja/${lastTableToken}`);
  }, [lastTableToken, scanRequested, router]);
  if (lastTableToken === undefined || (lastTableToken && !scanRequested)) return null;
  return (
    <TableMessage
      title="Scan QR di meja"
      body="Scan QR yang tertempel di meja untuk melihat menu dan memesan."
      action={<QrScanner />}
    />
  );
}
