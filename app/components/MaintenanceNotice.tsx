import { Wrench } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";

export const PESAN_PEMELIHARAAN = "KateringKita sedang dalam pemeliharaan. Silakan coba lagi nanti.";

/** F27: pengganti dashboard penjual saat admin menyalakan mode pemeliharaan. */
export function HalamanPemeliharaan({ pesan }: { pesan: string | null }) {
  return (
    <main id="konten" className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink">
      <EmptyState icon={Wrench} title="Sedang dalam pemeliharaan" body={pesan ?? PESAN_PEMELIHARAAN} />
    </main>
  );
}
