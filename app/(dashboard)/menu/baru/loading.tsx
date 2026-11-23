// Kerangka memuat /menu/baru.
// loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { MenuFormSkeleton } from "../components/MenuFormSkeleton";

/**
 * Kerangka formulir tambah menu.
 * @returns MenuFormSkeleton berjudul "Tambah menu"
 */
export default function Loading() {
  return <MenuFormSkeleton title="Tambah menu" />;
}
