"use client";

import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

// Panel kanan di desktop, selebar layar di bawah 768 px. `side="kiri"`: menu navigasi yang dibuka dari rail sidebar.
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className={
        side === "left"
          ? "ml-0 mr-auto h-dvh max-h-none w-full rounded-none md:w-72"
          : "mr-0 ml-auto h-dvh max-h-none w-full rounded-none md:w-[28rem]"
      }
    >
      {children}
    </Dialog>
  );
}
