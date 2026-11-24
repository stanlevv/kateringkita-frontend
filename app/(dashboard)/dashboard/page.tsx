// Halaman /dashboard: antrean pesanan, kuota hari ini, KPI, dan menu terlaris penjual.
// Server component: mengambil antrean pesanan (getQueue), daftar menu (getMenus), dan profil toko (getProfile) di
// server, lalu menyerahkannya ke DashboardLive (client component) yang memperbaruinya sendiri lewat polling.
import { DashboardLive } from "@/app/(dashboard)/dashboard/components/DashboardLive";
import { getMenus } from "@/services/menu.service";
import { getQueue } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman dashboard penjual. Selalu merender DashboardLive, juga saat data gagal diambil: bila klien sudah punya
 * data sebelumnya (mis. setelah router.refresh), data itu tetap ditampilkan dengan banner koneksi, bukan layar gagal.
 * @returns DashboardLive dengan data awal, atau dengan `data={null}` dan `loadFailed` bila ada yang gagal
 */
export default async function DashboardPage() {
  // 1. Pastikan penjual sudah masuk, lalu ambil antrean, menu, dan profil sekaligus.
  await requireMerchant();
  const [orders, menus, profile] = await Promise.all([getQueue(), getMenus(), getProfile()]);
  // 2. Salah satu gagal: serahkan ke DashboardLive sebagai galat.
  if ("error" in orders || "error" in menus || "error" in profile) {
    return <DashboardLive data={null} loadFailed />;
  }
  // 3. Catat waktu server saat data dimuat. Komponen server dirender sekali per permintaan, jadi nilai ini sama di
  // server dan saat hidrasi (React menyambungkan HTML dari server dengan kode di peramban). Waktu ini menjadi dasar
  // "Diperbarui N detik lalu" di klien.
  // eslint-disable-next-line react-hooks/purity
  const loadedAt = Date.now();
  return (
    <DashboardLive
      loadFailed={false}
      data={{
        orders: orders.data,
        menus: menus.data,
        hasPickupPoints: profile.data.pickup_point_ids.length > 0,
        loadedAt,
      }}
    />
  );
}
