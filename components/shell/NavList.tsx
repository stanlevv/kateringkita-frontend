"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, fokus } from "@/components/ui/cx";
import { NAV, adminNav } from "./nav";

/** `rail`: di bawah 1280 px hanya ikon (tooltip lewat title/aria-label); tanpa `rail` selalu penuh (drawer). */
export function NavList({ badge = 0, rail = false, onNavigate, admin = false }: { badge?: number; rail?: boolean; onNavigate?: () => void; admin?: boolean }) {
  const nav = admin ? adminNav : NAV;
  const path = usePathname();
  const teks = rail ? "hidden xl:inline" : "";
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-4">
      {nav.map((g) => (
        <div key={g.grup}>
          <h2 className={cx("px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted", rail && "hidden xl:block")}>{g.grup}</h2>
          {rail && <hr className="mx-3 border-line xl:hidden" />}
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
                      rail && "justify-center xl:justify-start",
                      aktif ? "border-primary bg-primary-soft font-semibold text-primary" : "border-transparent text-ink hover:bg-subtle",
                      fokus,
                    )}
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span className={cx("flex-1", teks)}>{label}</span>
                    {punyaBadge && badge > 0 && (
                      <span className={cx("min-w-5 rounded-full bg-warning-bg px-1.5 text-center text-xs font-bold text-warning", rail && "absolute right-0 top-0 xl:static")}>
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
