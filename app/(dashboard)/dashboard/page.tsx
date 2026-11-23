import { DashboardLive } from "@/app/(dashboard)/dashboard/components/DashboardLive";
import { getMenus } from "@/services/menu.service";
import { getQueue } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";

// M-03, M-04, M-05, M-08 — Dashboard live v3 (brief docs/design/dashboard-v3-brief.md).
// Selalu merender DashboardLive: galat saat polling memakai data terakhir di klien (DB-E5), bukan layar gagal.
export default async function DashboardPage() {
  await requireMerchant();
  const [orders, menus, profile] = await Promise.all([getQueue(), getMenus(), getProfile()]);
  if ("error" in orders || "error" in menus || "error" in profile) {
    return <DashboardLive data={null} loadFailed />;
  }
  // Komponen server dirender sekali per permintaan; waktu ini dasar "Diperbarui N detik lalu" di klien (sama saat hidrasi).
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
