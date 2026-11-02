"use client";

import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

// Panel kanan di desktop, selebar layar di bawah 768 px.
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} className="mr-0 ml-auto h-dvh max-h-none w-full rounded-none md:w-[28rem]">
      {children}
    </Dialog>
  );
}
