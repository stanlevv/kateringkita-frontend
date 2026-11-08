"use client";

import { useEffect, useRef } from "react";
import { CircleAlert } from "lucide-react";

// Dipasang setelah submit gagal. Fokus pindah ke sini (G-2) saat muncul pertama kali
// atau saat `focusKey` berubah (mis. penghitung submit); render ulang biasa tidak merebut fokus.
export function ErrorSummary({ errors, focusKey }: { errors: { id: string; message: string }[]; focusKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const ada = errors.length > 0;
  useEffect(() => { if (ada) ref.current?.focus(); }, [ada, focusKey]);
  if (!ada) return null;
  return (
    <div ref={ref} role="alert" tabIndex={-1} className="rounded-md border border-danger bg-danger-bg p-4 text-danger focus-visible:ring-2 focus-visible:ring-focus">
      <h2 className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden className="size-5" />
        Periksa isian berikut
      </h2>
      <ul className="mt-2 list-disc pl-10">
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => { ev.preventDefault(); document.getElementById(e.id)?.focus(); }}
              className="inline-flex min-h-11 items-center underline"
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
