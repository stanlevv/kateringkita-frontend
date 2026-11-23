// Komponen Switch: saklar nyala/mati (role="switch" agar dibacakan sebagai saklar oleh pembaca layar).
// Dipakai StoreStatusToggle, MenuForm, TableOrderSettings, PenyediaAiPanel, DaftarPopup.
import { cx, focusRing } from "./cx";

/**
 * Saklar nyala/mati. Status dibacakan lewat `aria-checked`.
 * @param props.checked menyala atau tidak
 * @param props.onChange dipanggil dengan nilai kebalikan saat diklik
 * @param props.label nama saklar untuk pembaca layar
 * @param props.disabled nonaktif (mis. selama permintaan berjalan)
 * @returns elemen `button`
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full disabled:opacity-50",
        focusRing,
      )}
    >
      <span
        className={cx(
          "flex h-7 w-12 items-center rounded-full p-0.5 transition-colors motion-reduce:transition-none",
          checked ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span
          className={cx(
            "size-6 rounded-full bg-surface transition-transform motion-reduce:transition-none",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
