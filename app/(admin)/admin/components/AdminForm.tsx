// Komponen AdminForm: formulir sederhana panel admin yang disusun dari daftar kolom. Dipakai tambah penjual, tambah
// pembeli, ubah profil toko, dan ubah akun, supaya keempat form itu berbagi satu cara validasi, tampilan galat, dan
// penanganan hasil server action.
// "use client": komponen ini berjalan di peramban karena memakai state.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input, Select, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import type { ActionResult } from "@/types/api";

/** Satu kolom formulir. `options` hanya untuk `select`; `digitsOnly` membuang selain angka (nomor WA). */
export type AdminFormField = {
  name: string;
  label: string;
  type?: "text" | "tel" | "email" | "password" | "textarea" | "select";
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  digitsOnly?: boolean;
  autoComplete?: string;
};

/**
 * Formulir admin berbasis daftar kolom.
 * @param props.id           awalan id elemen (unik per form di satu halaman)
 * @param props.title        judul form
 * @param props.fields       daftar kolom
 * @param props.initial      nilai awal per nama kolom
 * @param props.validate     pemeriksa isian di browser; mengembalikan pesan galat per nama kolom
 * @param props.submit       server action penyimpan
 * @param props.submitLabel  teks tombol simpan
 * @param props.successMessage teks toast setelah berhasil
 * @param props.afterSave    sesudah berhasil: `"refresh"` memuat ulang data halaman; `{ goTo }` pindah ke alamat itu
 *                           dengan `{id}` diganti id hasil simpan
 * @returns elemen `form`
 */
export function AdminForm<T>({
  id,
  title,
  fields,
  initial,
  validate,
  submit,
  submitLabel,
  successMessage,
  afterSave = "refresh",
}: {
  id: string;
  title?: string;
  fields: AdminFormField[];
  initial: Record<string, string>;
  validate: (values: Record<string, string>) => Record<string, string>;
  submit: (values: Record<string, string>) => Promise<ActionResult<T>>;
  submitLabel: string;
  successMessage: string;
  afterSave?: "refresh" | { goTo: string };
}) {
  // 1. State isian, galat server, dan status kirim. Galat browser baru tampil setelah mencoba menyimpan.
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const errors = { ...validate(values), ...serverErrors };
  const errorFor = (name: string) => (submitAttempted ? errors[name] : undefined);
  const labelOf = (name: string) => fields.find((field) => field.name === name)?.label ?? name;
  const dirty = fields.some((field) => (values[field.name] ?? "") !== (initial[field.name] ?? ""));

  // 2. Simpan: galat isian ditampilkan di ringkasan; galat per kolom dari server dipetakan ke kolomnya.
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return setFocusKey((count) => count + 1);
    if (saving || !dirty) return;
    setSaving(true);
    const result = await callAction(() => submit(values));
    setSaving(false);
    if ("error" in result) {
      if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([name, messages]) => [name, messages[0]])),
        );
        setFocusKey((count) => count + 1);
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    setSubmitAttempted(false);
    toast({ tone: "success", message: successMessage });
    if (afterSave === "refresh") router.refresh();
    else router.push(afterSave.goTo.replace("{id}", String((result.data as { id?: number } | null)?.id ?? "")));
  }

  const setValue = (name: string, value: string) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit} noValidate aria-label={title ?? submitLabel} className="flex max-w-xl flex-col gap-4">
      {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
      <ErrorSummary
        errors={
          submitAttempted
            ? Object.entries(errors).map(([name, message]) => ({
                id: `${id}-${name}`,
                message: `${labelOf(name)}: ${message}`,
              }))
            : []
        }
        focusKey={focusKey}
      />
      {fields.map((field) => {
        const value = values[field.name] ?? "";
        const onChange = (next: string) => setValue(field.name, field.digitsOnly ? next.replace(/\D/g, "") : next);
        return (
          <Field
            key={field.name}
            label={field.label}
            id={`${id}-${field.name}`}
            required={field.required}
            help={field.help}
            error={errorFor(field.name)}
          >
            {field.type === "textarea" ? (
              <Textarea value={value} onChange={(event) => onChange(event.target.value)} />
            ) : field.type === "select" ? (
              <Select value={value} onChange={(event) => onChange(event.target.value)}>
                <option value="">Pilih</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                type={field.type ?? "text"}
                inputMode={field.digitsOnly ? "numeric" : undefined}
                autoComplete={field.autoComplete}
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
            )}
          </Field>
        );
      })}
      <div>
        <Button type="submit" loading={saving} loadingText="Menyimpan…" disabled={!dirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
