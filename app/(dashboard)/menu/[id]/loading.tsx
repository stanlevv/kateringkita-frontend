// Kerangka memuat /menu/[id].
// loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { MenuFormSkeleton } from "@/app/components/menu/MenuFormSkeleton";

/**
 * Kerangka formulir ubah menu.
 * @returns MenuFormSkeleton berjudul "Ubah menu"
 */
export default function Loading() {
  return <MenuFormSkeleton title="Ubah menu" />;
}
