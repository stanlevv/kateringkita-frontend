import type { ReactNode } from "react";
import { MobileBlock } from "@/app/components/shell/MobileBlock";

// Template (bukan layout) agar aturan layar lebar tidak menyentuh layout grup ini
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileBlock />
      {children}
    </>
  );
}
