// Daftar menu navigasi panel penjual dan panel admin. Satu definisi untuk sidebar, rail tablet, dan drawer ponsel.
// Dibaca NavList.
import {
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  ImageIcon,
  BarChart3,
  Calculator,
  Database,
  Flag,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  Wallet,
  MessageCircle,
  ScrollText,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  ClipboardList,
  UserCog,
  type LucideIcon,
} from "lucide-react";

/**
 * Satu menu. `badge`: true = jumlah pesanan perlu tindakan; "notifications" = notifikasi belum dibaca.
 * `exact`: aktif hanya bila URL sama persis (bukan juga sub-halamannya).
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean | "notifications";
  exact?: boolean;
};
/** Satu kelompok menu dengan judul kecil di atasnya. */
export type NavGroup = { title: string; items: NavItem[] };

/** Menu panel admin. Menu khusus tingkat super disaring NavList lewat canAccessPage (lib/admin-level.ts). */
export const ADMIN_NAV: NavGroup[] = [
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LayoutGrid, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/admin/penjual", label: "Penjual", icon: Store },
      { href: "/admin/moderasi", label: "Moderasi", icon: Flag },
      // Tiket bantuan: semua tingkat (super, ops, support), bukan KHUSUS_SUPER di lib/admin-level.ts
      { href: "/admin/tiket", label: "Tiket", icon: LifeBuoy },
      { href: "/admin/data-master", label: "Data master", icon: Database },
      { href: "/admin/promo", label: "Promo & biaya", icon: Tag },
      // Banner beranda: semua tingkat melihat, super & ops memutuskan (bukan KHUSUS_SUPER)
      { href: "/admin/banner", label: "Banner", icon: ImageIcon },
      { href: "/admin/popup", label: "Pop-up", icon: Megaphone },
      { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
      { href: "/admin/pencairan", label: "Pencairan", icon: Banknote },
      { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
      // Verifikasi hasil AI: semua tingkat melihat, super & ops memutuskan (bukan KHUSUS_SUPER)
      { href: "/admin/hasil-ai", label: "Verifikasi AI", icon: BadgeCheck },
      { href: "/admin/ai", label: "AI", icon: Sparkles },
      { href: "/admin/admin", label: "Kelola admin", icon: UserCog },
      { href: "/admin/log", label: "Log", icon: ScrollText },
      { href: "/admin/server", label: "Server", icon: Server },
    ],
  },
];

/** Menu panel penjual. */
export const MERCHANT_NAV: NavGroup[] = [
  {
    title: "Operasional",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, badge: true },
      { href: "/menu", label: "Menu & Stok", icon: BookOpen },
      { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
      { href: "/laporan", label: "Laporan", icon: BarChart3 },
    ],
  },
  {
    title: "Pemasaran",
    items: [
      { href: "/promo", label: "Promo", icon: Tag },
      { href: "/banner", label: "Banner", icon: ImageIcon },
      { href: "/ulasan", label: "Ulasan", icon: Star },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/notifikasi", label: "Notifikasi", icon: Bell, badge: "notifications" },
      { href: "/pengaturan", label: "Toko", icon: Store },
      { href: "/template-wa", label: "Template WA", icon: MessageCircle },
    ],
  },
  { title: "Alat", items: [{ href: "/copilot", label: "Kalkulator HPP", icon: Calculator }] },
];
