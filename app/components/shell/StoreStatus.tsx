"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type StoreInfo = { isOpen: boolean; openTime: string; closeTime: string };
type StoreStatusValue = StoreInfo & { setIsOpen: (nextIsOpen: boolean) => void };

const StoreStatusContext = createContext<StoreStatusValue | null>(null);

/** Satu sumber status dapur untuk sidebar dan drawer; disinkronkan ulang bila nilai dari server berubah. */
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

export function useStoreStatus(): StoreStatusValue {
  const value = useContext(StoreStatusContext);
  if (!value) throw new Error("StoreStatusProvider belum dipasang.");
  return value;
}
