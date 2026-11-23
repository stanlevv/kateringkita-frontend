// Template grup admin: menampilkan MobileBlock (penutup layar ponsel) di atas setiap halaman admin.
import type { ReactNode } from "react";
import { MobileBlock } from "@/app/components/shell/MobileBlock";

/**
 * Template = file khusus Next.js yang mirip layout, tetapi dibuat ulang setiap kali pindah halaman. Dipakai template
 * (bukan layout) agar aturan layar lebar tidak menyentuh layout grup ini.
 * @param props.children halaman yang sedang dibuka
 * @returns MobileBlock diikuti halaman
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileBlock />
      {children}
    </>
  );
}
