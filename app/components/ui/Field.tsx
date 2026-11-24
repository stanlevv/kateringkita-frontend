// Komponen Field: membungkus satu isian form dengan label, teks bantuan, dan pesan galat yang terhubung untuk
// aksesibilitas.
// Dipakai di semua form.
import { cloneElement, useId, type ReactElement } from "react";
import { CircleAlert } from "lucide-react";

// Atribut yang dipasang Field ke isian di dalamnya.
type ChildProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; "aria-required"?: boolean };

/**
 * Label + isian + bantuan + galat. Isian anak diberi `id`, `aria-describedby` (menunjuk teks bantuan/galat agar
 * dibacakan), `aria-invalid` saat galat, dan `aria-required` bila wajib.
 * @param props.label teks label
 * @param props.help teks bantuan opsional
 * @param props.error pesan galat opsional
 * @param props.required tampilkan tanda * dan tandai wajib
 * @param props.id id isian; bila kosong dibuat otomatis
 * @param props.children satu elemen isian (Input, Select, Textarea, ...)
 * @returns elemen `div`
 */
export function Field({
  label,
  help,
  error,
  required,
  id,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  id?: string;
  children: ReactElement<ChildProps>;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [help && `${fieldId}-help`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        )}
      </label>
      {cloneElement(children, {
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}
      {help && (
        <p id={`${fieldId}-help`} className="text-sm text-ink-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
