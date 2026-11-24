// Komponen MaintenanceNotice: halaman pemberitahuan saat admin menyalakan mode pemeliharaan.
// Dipakai app/(dashboard)/layout.tsx; pesan bawaannya juga dipakai halaman login.
import { Wrench } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";

/** Pesan bawaan bila admin tidak mengisi pesan pemeliharaan. */
export const DEFAULT_MAINTENANCE_MESSAGE = "KateringKita sedang dalam pemeliharaan. Silakan coba lagi nanti.";

/**
 * Pengganti seluruh dashboard penjual selama pemeliharaan. Selama itu backend menolak permintaan penjual (503),
 * jadi sidebar dan halaman biasa tidak ditampilkan.
 * @param props.message pesan dari admin; null memakai pesan bawaan
 * @returns elemen `main` berisi EmptyState
 */
export function MaintenanceNotice({ message }: { message: string | null }) {
  return (
    <main id="konten" className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink">
      <EmptyState icon={Wrench} title="Sedang dalam pemeliharaan" body={message ?? DEFAULT_MAINTENANCE_MESSAGE} />
    </main>
  );
}
