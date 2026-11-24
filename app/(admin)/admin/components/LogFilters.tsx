// Komponen LogFilters: filter log aksi admin di /admin/log (aksi, jenis target, dari tanggal, sampai tanggal).
// Nilai filter disimpan di URL (?action=&target_type=&from=&to=), lalu halaman server membaca URL itu.
// "use client": komponen ini berjalan di peramban (client component) karena memakai router dan membaca URL.
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { LOG_ACTIONS, LOG_TARGETS } from "@/services/admin-log.service";
import { buildUrl } from "@/lib/url";

/**
 * Filter log. Filter ada di URL (bisa dibagikan dan tetap ada saat dimuat ulang); mengubah filter kembali ke halaman 1.
 * @returns formulir pencarian berisi 4 isian
 */
export function LogFilters() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  // Membuat pengubah untuk satu parameter URL: nilai kosong menghapusnya, `page` selalu dibuang.
  const updateParam = (paramName: string) => (event: { target: { value: string } }) =>
    router.replace(buildUrl(path, params.toString(), { [paramName]: event.target.value, page: "" }), { scroll: false });

  return (
    <form
      role="search"
      aria-label="Filter log"
      onSubmit={(event) => event.preventDefault()}
      className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Aksi">
        <Select value={params.get("action") ?? ""} onChange={updateParam("action")}>
          <option value="">Semua aksi</option>
          {LOG_ACTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Jenis target">
        <Select value={params.get("target_type") ?? ""} onChange={updateParam("target_type")}>
          <option value="">Semua target</option>
          {LOG_TARGETS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Dari tanggal">
        <Input type="date" value={params.get("from") ?? ""} onChange={updateParam("from")} />
      </Field>
      <Field label="Sampai tanggal">
        <Input type="date" value={params.get("to") ?? ""} onChange={updateParam("to")} />
      </Field>
    </form>
  );
}
