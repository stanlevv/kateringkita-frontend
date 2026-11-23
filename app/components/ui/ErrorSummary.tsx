// Komponen ErrorSummary: ringkasan galat form di atas form, berisi tautan ke tiap isian yang salah.
// Dipakai form login, daftar, lupa sandi, menu, pengaturan, dan lainnya.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useEffect, useRef } from "react";
import { CircleAlert } from "lucide-react";

/**
 * Ringkasan galat (role="alert") yang dipasang setelah submit gagal. Fokus pindah ke sini saat muncul pertama kali
 * atau saat `focusKey` berubah (mis. penghitung submit), agar pengguna keyboard dan pembaca layar langsung tahu;
 * render ulang biasa tidak merebut fokus.
 * @param props.errors daftar `{ id isian, pesan }`; kosong = tidak dirender
 * @param props.focusKey ganti nilainya untuk memindahkan fokus ke ringkasan lagi
 * @returns elemen `div`, atau null bila tanpa galat
 */
export function ErrorSummary({ errors, focusKey }: { errors: { id: string; message: string }[]; focusKey?: number }) {
  // 1. Ref ke kotak ringkasan agar bisa difokus.
  const ref = useRef<HTMLDivElement>(null);
  const hasErrors = errors.length > 0;
  // 2. Pindahkan fokus ke ringkasan saat galat muncul atau `focusKey` berganti. 3. Tanpa galat tidak dirender.
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
