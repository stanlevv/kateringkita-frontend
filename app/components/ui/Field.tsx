import { cloneElement, useId, type ReactElement } from "react";
import { CircleAlert } from "lucide-react";

type Anak = { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; "aria-required"?: boolean };

export function Field({ label, help, error, required, id, children }: { label: string; help?: string; error?: string; required?: boolean; id?: string; children: ReactElement<Anak> }) {
  const auto = useId();
  const fid = id ?? auto;
  const ids = [help && `${fid}-help`, error && `${fid}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden className="text-danger"> *</span>}
      </label>
      {cloneElement(children, { id: fid, "aria-describedby": ids, "aria-invalid": error ? true : undefined, "aria-required": required || undefined })}
      {help && <p id={`${fid}-help`} className="text-sm text-ink-muted">{help}</p>}
      {error && (
        <p id={`${fid}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
