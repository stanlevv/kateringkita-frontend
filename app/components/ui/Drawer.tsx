// Komponen Drawer: panel yang meluncur dari sisi layar, dibangun di atas Dialog.
// Dipakai OrderSlipDrawer (slip pesanan) dan MobileNav (menu navigasi).
"use client";

import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

/**
 * Panel samping: di desktop menempel di kanan (atau kiri), di bawah 768 px selebar layar.
 * @param props.open tampil atau tidak
 * @param props.onClose dipanggil saat pengguna menutup (tombol Tutup atau Esc)
 * @param props.title judul panel
 * @param props.children isi panel
 * @param props.side `"right"` (bawaan) atau `"left"` untuk menu navigasi yang dibuka dari rail sidebar
 * @returns Dialog bergaya panel
 */
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
