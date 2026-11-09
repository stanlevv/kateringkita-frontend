import { BookOpen, BarChart3, Calculator, Database, Flag, LayoutGrid, Megaphone, Wallet, MessageCircle, ScrollText, Server, ShieldCheck, Sparkles, Star, Store, Tag, ClipboardList, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: boolean; exact?: boolean };
export type NavGroup = { grup: string; items: NavItem[] };

// F18: navigasi panel admin; halaman Verifikasi s.d. Promo dibangun bertahap.
export const adminNav: NavGroup[] = [
  {
    grup: "Admin",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LayoutGrid, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/admin/penjual", label: "Penjual", icon: Store },
      { href: "/admin/moderasi", label: "Moderasi", icon: Flag },
      { href: "/admin/data-master", label: "Data master", icon: Database },
      { href: "/admin/promo", label: "Promo & biaya", icon: Tag },
      { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
      { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
      { href: "/admin/ai", label: "AI", icon: Sparkles },
      { href: "/admin/log", label: "Log", icon: ScrollText },
      { href: "/admin/server", label: "Server", icon: Server },
    ],
  },
];

// SH-N1: satu definisi untuk sidebar, rail tablet, dan drawer ponsel.
export const NAV: NavGroup[] = [
  {
    grup: "Operasional",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, badge: true },
      { href: "/menu", label: "Menu & Stok", icon: BookOpen },
      { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
      { href: "/laporan", label: "Laporan", icon: BarChart3 },
    ],
  },
  {
    grup: "Pemasaran",
    items: [
      { href: "/promo", label: "Promo", icon: Tag },
      { href: "/ulasan", label: "Ulasan", icon: Star },
    ],
  },
  {
    grup: "Pengaturan",
    items: [
      { href: "/pengaturan", label: "Toko", icon: Store },
      { href: "/template-wa", label: "Template WA", icon: MessageCircle },
    ],
  },
  { grup: "Alat", items: [{ href: "/copilot", label: "Kalkulator HPP", icon: Calculator }] },
];
