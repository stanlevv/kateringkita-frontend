import { cx, fokus } from "./cx";

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx("inline-flex min-h-11 min-w-11 items-center justify-center rounded-full disabled:opacity-50", fokus)}
    >
      <span className={cx("flex h-7 w-12 items-center rounded-full p-0.5 transition-colors motion-reduce:transition-none", checked ? "bg-primary" : "bg-line-strong")}>
        <span className={cx("size-6 rounded-full bg-surface transition-transform motion-reduce:transition-none", checked && "translate-x-5")} />
      </span>
    </button>
  );
}
