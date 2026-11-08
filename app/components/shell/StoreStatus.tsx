"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type StoreInfo = { isOpen: boolean; buka: string; tutup: string };
type Nilai = StoreInfo & { setIsOpen: (v: boolean) => void };

const Konteks = createContext<Nilai | null>(null);

/** Satu sumber status dapur untuk sidebar dan drawer; disinkronkan ulang bila nilai dari server berubah. */
export function StoreStatusProvider({ store, children }: { store: StoreInfo | null; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(store?.isOpen ?? true);
  const [dariServer, setDariServer] = useState(store?.isOpen);
  if (store && store.isOpen !== dariServer) {
    setDariServer(store.isOpen);
    setIsOpen(store.isOpen);
  }
  if (!store) return <>{children}</>;
  return <Konteks.Provider value={{ ...store, isOpen, setIsOpen }}>{children}</Konteks.Provider>;
}

export function useStoreStatus(): Nilai {
  const v = useContext(Konteks);
  if (!v) throw new Error("StoreStatusProvider belum dipasang.");
  return v;
}
