// Status dapur (buka/tutup) bersama untuk sidebar, drawer, dan banner dashboard lewat React context
// (wadah nilai yang bisa dibaca semua komponen di bawah Provider tanpa dioper satu per satu).
// Provider dipasang di layout app/(dashboard); dibaca StoreStatusToggle dan DashboardLive.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** Status dapur dari server: saklar buka dan jam buka/tutup (HH:MM). */
export type StoreInfo = { isOpen: boolean; openTime: string; closeTime: string };
// Isi context: status dari server + pengubah status lokal.
type StoreStatusValue = StoreInfo & { setIsOpen: (nextIsOpen: boolean) => void };

const StoreStatusContext = createContext<StoreStatusValue | null>(null);

/**
 * Satu sumber status dapur untuk sidebar dan drawer; disinkronkan ulang bila nilai dari server berubah.
 * @param props.store status dari server, atau null (anak tetap dirender tanpa context)
 * @param props.children isi layout
 * @returns Provider context
 */
export function StoreStatusProvider({ store, children }: { store: StoreInfo | null; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(store?.isOpen ?? true);
  const [serverIsOpen, setServerIsOpen] = useState(store?.isOpen);
  if (store && store.isOpen !== serverIsOpen) {
    setServerIsOpen(store.isOpen);
    setIsOpen(store.isOpen);
  }
  if (!store) return <>{children}</>;
  return <StoreStatusContext.Provider value={{ ...store, isOpen, setIsOpen }}>{children}</StoreStatusContext.Provider>;
}

/**
 * Membaca status dapur bersama. Melempar galat bila dipanggil di luar StoreStatusProvider.
 * @returns status dapur dan `setIsOpen`
 */
export function useStoreStatus(): StoreStatusValue {
  const value = useContext(StoreStatusContext);
  if (!value) throw new Error("StoreStatusProvider belum dipasang.");
  return value;
}
