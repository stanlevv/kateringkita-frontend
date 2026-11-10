import { cx } from "@/app/components/ui/cx";

/** Logo aplikasi mobile (tudung saji + uap) sebagai SVG; warna dari currentColor. Sama dengan app/icon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M9.4 3.9c-.55.75-.55 1.5 0 2.25M12 3.4c-.6.8-.6 1.6 0 2.4M14.6 3.9c-.55.75-.55 1.5 0 2.25" stroke="currentColor" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="8.9" r="1.25" fill="currentColor" />
      <path d="M5.4 17.2a6.6 6.6 0 0 1 13.2 0z" fill="currentColor" />
      <rect x="4" y="18.4" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function Brand({ rail = false }: { rail?: boolean }) {
  return (
    <div className={cx("flex items-center gap-2", rail && "justify-center sb-lebar:justify-start")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-br from-accent to-accent-light text-surface shadow-[0_6px_14px_-6px_rgb(255_107_53/.7)]">
        <LogoMark className="size-6" />
      </span>
      <span className={cx("font-display text-lg font-extrabold tracking-tight text-ink", rail && "hidden sb-lebar:inline")}>
        Katering<span className="text-primary">Kita</span>
      </span>
    </div>
  );
}
