import { DashboardLive } from "@/app/(dashboard)/dashboard/components/DashboardLive";
import { getMenus } from "@/services/menuService";
import { getAntrean } from "@/services/orderService";
import { getProfile } from "@/services/profileService";
import { requireMerchant } from "@/services/authService";

// M-03, M-04, M-05, M-08 — Dashboard live v3 (brief docs/design/dashboard-v3-brief.md).
// Selalu merender DashboardLive: galat saat polling memakai data terakhir di klien (DB-E5), bukan layar gagal.
export default async function DashboardPage() {
  await requireMerchant();
  const [orders, menus, profil] = await Promise.all([getAntrean(), getMenus(), getProfile()]);
  if ("error" in orders || "error" in menus || "error" in profil) {
    return <DashboardLive data={null} galat />;
  }
  // Komponen server dirender sekali per permintaan; waktu ini dasar "Diperbarui N detik lalu" di klien (sama saat hidrasi).
  // eslint-disable-next-line react-hooks/purity
  const dimuat = Date.now();
  return (
    <DashboardLive
      galat={false}
      data={{ orders: orders.data, menus: menus.data, adaTitikTemu: profil.data.pickup_point_ids.length > 0, dimuat }}
    />
  );
}
