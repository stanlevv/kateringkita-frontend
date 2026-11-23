import { Wrench } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";

export const DEFAULT_MAINTENANCE_MESSAGE = "KateringKita sedang dalam pemeliharaan. Silakan coba lagi nanti.";

/** F27: pengganti dashboard penjual saat admin menyalakan mode pemeliharaan. */
export function MaintenanceNotice({ message }: { message: string | null }) {
  return (
    <main id="konten" className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink">
      <EmptyState icon={Wrench} title="Sedang dalam pemeliharaan" body={message ?? DEFAULT_MAINTENANCE_MESSAGE} />
    </main>
  );
}
