"use client";

import { useEffect, useRef } from "react";
import { CircleAlert } from "lucide-react";

// Dipasang setelah submit gagal. Fokus pindah ke sini (G-2) saat muncul pertama kali
// atau saat `focusKey` berubah (mis. penghitung submit); render ulang biasa tidak merebut fokus.
export function ErrorSummary({ errors, focusKey }: { errors: { id: string; message: string }[]; focusKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasErrors = errors.length > 0;
  useEffect(() => {
    if (hasErrors) ref.current?.focus();
  }, [hasErrors, focusKey]);
  if (!hasErrors) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-md border border-danger bg-danger-bg p-4 text-danger focus-visible:ring-2 focus-visible:ring-focus"
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden className="size-5" />
        Periksa isian berikut
      </h2>
      <ul className="mt-2 list-disc pl-10">
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(error.id)?.focus();
              }}
              className="inline-flex min-h-11 items-center underline"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
