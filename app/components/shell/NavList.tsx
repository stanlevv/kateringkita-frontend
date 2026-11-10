"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, fokus } from "@/app/components/ui/cx";
import { halamanBoleh } from "@/lib/admin-level";
import { NAV, adminNav } from "./nav";

/** `rail`: hanya ikon (tooltip lewat title/aria-label) kecuali sidebar sedang lebar (varian sb-lebar); tanpa `rail` selalu penuh (drawer). */
/** `level`: tingkat admin; menu khusus super disembunyikan untuk tingkat lain. */
export function NavList({ badge = 0, rail = false, onNavigate, admin = false, level }: { badge?: number; rail?: boolean; onNavigate?: () => void; admin?: boolean; level?: unknown }) {
  const nav = admin ? adminNav.map((g) => ({ ...g, items: g.items.filter((i) => halamanBoleh(level, i.href)) })) : NAV;
  const path = usePathname();
  const teks = rail ? "hidden sb-lebar:inline" : "";
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-4">
      {nav.map((g) => (
        <div key={g.grup}>
          <h2 className={cx("px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted", rail && "hidden sb-lebar:block")}>{g.grup}</h2>
          {rail && <hr className="mx-3 border-line sb-lebar:hidden" />}
          <ul className="flex flex-col gap-1">
            {g.items.map(({ href, label, icon: Icon, badge: punyaBadge, exact }) => {
              const aktif = path === href || (!exact && path.startsWith(`${href}/`));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={label}
                    aria-current={aktif ? "page" : undefined}
                    className={cx(
                      "relative flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 text-sm",
                      rail && "justify-center sb-lebar:justify-start",
                      aktif ? "border-accent bg-primary-soft font-semibold text-primary" : "border-transparent text-ink hover:bg-subtle",
                      fokus,
                    )}
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span className={cx("flex-1", teks)}>{label}</span>
                    {punyaBadge && badge > 0 && (
                      <span className={cx("min-w-5 rounded-full bg-warning-bg px-1.5 text-center text-xs font-bold text-warning", rail && "absolute right-0 top-0 sb-lebar:static")}>
                        <span aria-hidden>{badge}</span>
                        <span className="sr-only">{badge} perlu tindakan</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
