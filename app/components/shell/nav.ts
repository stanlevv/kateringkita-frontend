// Daftar menu navigasi panel penjual dan panel admin. Satu definisi untuk sidebar, rail tablet, dan drawer ponsel.
// Dibaca NavList.
import {
  AppWindow,
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
  Users,
} from "lucide-react";

/**
 * Satu menu. `badge`: true = jumlah pesanan perlu tindakan; "notifications" = notifikasi belum dibaca;
 * "chats" = pesan pembeli belum dibaca di chat pesanan; kunci antrean admin ("merchants_pending", "tickets_open",
 * "chats_reported", "ai_results_pending") = hitungan dari GET /admin/queues; "payouts" = toko siap dicairkan + refund
 * menunggu.
 * `exact`: aktif hanya bila URL sama persis (bukan juga sub-halamannya).
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?:
    | boolean
    | "notifications"
    | "chats"
    | "merchants_pending"
    | "tickets_open"
    | "chats_reported"
    | "ai_results_pending"
    | "payouts";
  exact?: boolean;
};
/** Satu kelompok menu dengan judul kecil di atasnya; judul "" = kelompok tanpa judul. */
export type NavGroup = { title: string; items: NavItem[] };

/**
 * Menu panel admin, berkelompok. Menu khusus tingkat super disaring NavList lewat canAccessPage (lib/admin-level.ts);
 * kelompok yang semua menunya tersaring ikut disembunyikan.
 */
export const ADMIN_NAV: NavGroup[] = [
  { title: "", items: [{ href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true }] },
  {
    title: "Pengguna",
    items: [
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck, badge: "merchants_pending" },
      { href: "/admin/penjual", label: "Penjual", icon: Store },
      { href: "/admin/pembeli", label: "Pembeli", icon: Users },
    ],
  },
  {
    title: "Layanan",
    items: [
      // Tiket bantuan: semua tingkat (super, ops, support), tidak termasuk SUPER_ONLY_PAGES di lib/admin-level.ts
      { href: "/admin/tiket", label: "Tiket", icon: LifeBuoy, badge: "tickets_open" },
      { href: "/admin/chat-dilaporkan", label: "Chat dilaporkan", icon: MessageCircle, badge: "chats_reported" },
      { href: "/admin/moderasi", label: "Moderasi", icon: Flag },
      // Verifikasi hasil AI: semua tingkat melihat, super & ops memutuskan (tidak termasuk SUPER_ONLY_PAGES)
      { href: "/admin/hasil-ai", label: "Verifikasi AI", icon: BadgeCheck, badge: "ai_results_pending" },
    ],
  },
  {
    title: "Konten & promo",
    items: [
      // Banner beranda: semua tingkat melihat, super & ops memutuskan (tidak termasuk SUPER_ONLY_PAGES)
      { href: "/admin/banner", label: "Banner", icon: ImageIcon },
      { href: "/admin/popup", label: "Pop-up", icon: AppWindow },
      { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
      { href: "/admin/promo", label: "Promo & biaya", icon: Tag },
      { href: "/admin/data-master", label: "Data master", icon: Database },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
      { href: "/admin/pencairan", label: "Pencairan", icon: Banknote, badge: "payouts" },
    ],
  },
  {
    title: "Sistem",
    items: [
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
      { href: "/pesanan", label: "Pesanan", icon: ClipboardList, badge: "chats" },
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
