import type { ReactNode } from "react";
import { BlokPonsel } from "@/app/components/shell/BlokPonsel";

// Template (bukan layout) agar aturan layar lebar tidak menyentuh layout grup ini
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <BlokPonsel />
      {children}
    </>
  );
}
