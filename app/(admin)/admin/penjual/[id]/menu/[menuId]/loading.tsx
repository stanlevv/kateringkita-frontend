// Kerangka memuat /admin/penjual/<id>/menu/<menuId>. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { MenuFormSkeleton } from "@/app/components/menu/MenuFormSkeleton";

/**
 * Kerangka formulir menu toko di panel admin.
 * @returns MenuFormSkeleton berjudul "Ubah menu toko"
 */
export default function Loading() {
  return <MenuFormSkeleton title="Ubah menu toko" />;
}
