"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { AKSI_LOG, TARGET_LOG } from "@/services/adminLogService";
import { urlDengan } from "@/lib/url";

// Filter ada di URL (bisa dibagikan, tahan muat ulang); mengubah filter kembali ke halaman 1.
export function LogFilters() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const ubah = (k: string) => (e: { target: { value: string } }) =>
    router.replace(urlDengan(path, params.toString(), { [k]: e.target.value, page: "" }), { scroll: false });

  return (
    <form role="search" aria-label="Filter log" onSubmit={(e) => e.preventDefault()} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Aksi">
        <Select value={params.get("action") ?? ""} onChange={ubah("action")}>
          <option value="">Semua aksi</option>
          {AKSI_LOG.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Jenis target">
        <Select value={params.get("target_type") ?? ""} onChange={ubah("target_type")}>
          <option value="">Semua target</option>
          {TARGET_LOG.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Dari tanggal">
        <Input type="date" value={params.get("from") ?? ""} onChange={ubah("from")} />
      </Field>
      <Field label="Sampai tanggal">
        <Input type="date" value={params.get("to") ?? ""} onChange={ubah("to")} />
      </Field>
    </form>
  );
}
