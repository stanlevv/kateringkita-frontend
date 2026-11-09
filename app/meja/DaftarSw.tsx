"use client";

import { useEffect } from "react";

// Service worker hanya untuk /meja (lihat public/sw-meja.js); gagal daftar tidak mengganggu pemesanan
export function DaftarSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw-meja.js", { scope: "/meja" }).catch(() => {});
  }, []);
  return null;
}
