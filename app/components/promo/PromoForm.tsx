"use client";

import { useState } from "react";
import { savePromo } from "@/app/actions/promos";
import { callAction } from "@/lib/action";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { wibInputToIso, isoToWibInput } from "@/lib/format";
import { validatePromo } from "@/lib/schemas";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const FIELD_LABELS: Record<string, string> = {
  code: "Kode promo",
  description: "Deskripsi",
  type: "Jenis promo",
  value: "Nilai",
  max_discount: "Maks potongan",
  min_subtotal: "Min belanja",
  quota: "Kuota",
  per_user_limit: "Batas per pembeli",
  starts_at: "Mulai",
  ends_at: "Selesai",
};
const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));
const toOptionalNumber = (text: string) => (text.trim() === "" ? null : Number(text));

type PromoFormValues = {
  code: string;
  description: string;
  type: Promo["type"];
  value: string;
  max_discount: string;
  min_subtotal: string;
  quota: string;
  per_user_limit: string;
  starts: string;
  ends: string;
  is_active: boolean;
  is_public: boolean;
};

const toFormValues = (promo?: Promo | null): PromoFormValues => {
  const nowIso = new Date().toISOString();
  return {
    code: promo?.code ?? "",
    description: promo?.description ?? "",
    type: promo?.type ?? "percent",
    value: promo ? String(promo.value) : "",
    max_discount: promo?.max_discount ? String(promo.max_discount) : "",
    min_subtotal: String(promo?.min_subtotal ?? 0),
    quota: promo?.quota != null ? String(promo.quota) : "",
    per_user_limit: String(promo?.per_user_limit ?? 1),
    starts: isoToWibInput(promo?.starts_at ?? nowIso),
    ends: isoToWibInput(promo?.ends_at ?? new Date(Date.now() + 30 * 86400e3).toISOString()),
    is_active: promo?.is_active ?? true,
    is_public: promo?.is_public ?? true,
  };
};

/** M-13, PR-N2/N3/E1/E2: isi dialog buat/ubah promo. `promo` ada = mode ubah. */
export function PromoForm({
  promo,
  onSaved,
  onClose,
  saveAction = savePromo,
  admin,
}: {
  promo?: Promo | null;
  onSaved: (savedPromo: Promo) => void;
  onClose: () => void;
  saveAction?: (id: number | null, input: unknown) => Promise<ActionResult<Promo>>;
  admin?: boolean;
}) {
  const [values, setValues] = useState<PromoFormValues>(() => toFormValues(promo));
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof PromoFormValues>(field: K, value: PromoFormValues[K]) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  const blurHandler = (field: string) => () => setTouched((previous) => new Set(previous).add(field));

  const isPercent = values.type === "percent";
  const input = {
    code: values.code,
    description: values.description,
    type: values.type,
    value: values.type === "free_service_fee" ? 0 : toNumber(values.value),
    max_discount: isPercent ? toOptionalNumber(values.max_discount) : null,
    min_subtotal: toNumber(values.min_subtotal),
    quota: toOptionalNumber(values.quota),
    per_user_limit: toNumber(values.per_user_limit),
    starts_at: wibInputToIso(values.starts),
    ends_at: wibInputToIso(values.ends),
    is_active: values.is_active,
    is_public: values.is_public,
  };
  const clientErrors = validatePromo(input, promo?.used_count ?? 0);
  const allErrors = submitAttempted ? { ...serverErrors, ...clientErrors } : clientErrors;
  const fieldError = (field: string) => (submitAttempted || touched.has(field) ? allErrors[field] : undefined);
  const errorSummary = submitAttempted
    ? Object.entries(allErrors).map(([field, message]) => ({
        id: `pf-${field}`,
        message: `${FIELD_LABELS[field] ?? field}: ${message}`,
      }))
    : [];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(clientErrors).length > 0) {
      setSubmitAttempted(true);
      setErrorFocusKey((count) => count + 1);
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveAction(promo?.id ?? null, input));
    setSaving(false);
    if ("error" in result) {
      if (result.error.fields) {
        // PR-E1
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
        setSubmitAttempted(true);
        setErrorFocusKey((count) => count + 1);
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    toast({ tone: "success", message: "Promo disimpan" });
    onSaved(result.data);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
      <Field
        label="Kode promo"
        id="pf-code"
        required
        help={admin && promo ? "Kode tidak bisa diubah." : "3–30 huruf besar atau angka, tanpa spasi."}
        error={fieldError("code")}
      >
        <Input
          value={values.code}
          maxLength={30}
          readOnly={admin && !!promo}
          onChange={(event) => setField("code", event.target.value.toUpperCase())}
          onBlur={blurHandler("code")}
          className="font-mono"
        />
      </Field>
      <Field label="Deskripsi" id="pf-description" error={fieldError("description")}>
        <Input
          value={values.description}
          maxLength={255}
          onChange={(event) => setField("description", event.target.value)}
          onBlur={blurHandler("description")}
        />
      </Field>
      <Field label="Jenis promo" id="pf-type" required error={fieldError("type")}>
        <Select
          value={values.type}
          onChange={(event) => setField("type", event.target.value as Promo["type"])}
          onBlur={blurHandler("type")}
        >
          <option value="percent">Persen</option>
          <option value="fixed">Potongan Rupiah</option>
          {/* C2: biaya layanan milik platform — hanya admin, atau promo toko lama yang sudah berjenis ini */}
          {(admin || promo?.type === "free_service_fee") && (
            <option value="free_service_fee">Gratis biaya layanan</option>
          )}
        </Select>
      </Field>
      {values.type !== "free_service_fee" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isPercent ? "Nilai (%)" : "Nilai (Rp)"} id="pf-value" required error={fieldError("value")}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.value}
              onChange={(event) => setField("value", event.target.value)}
              onBlur={blurHandler("value")}
            />
          </Field>
          {isPercent && (
            <Field
              label="Maks potongan (Rp)"
              id="pf-max_discount"
              help="Kosongkan bila tanpa batas."
              error={fieldError("max_discount")}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={values.max_discount}
                onChange={(event) => setField("max_discount", event.target.value)}
                onBlur={blurHandler("max_discount")}
              />
            </Field>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min belanja (Rp)" id="pf-min_subtotal" required error={fieldError("min_subtotal")}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={values.min_subtotal}
            onChange={(event) => setField("min_subtotal", event.target.value)}
            onBlur={blurHandler("min_subtotal")}
          />
        </Field>
        <Field label="Kuota" id="pf-quota" help="Kosong = tanpa batas." error={fieldError("quota")}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.quota}
            onChange={(event) => setField("quota", event.target.value)}
            onBlur={blurHandler("quota")}
          />
        </Field>
        <Field label="Batas per pembeli" id="pf-per_user_limit" required error={fieldError("per_user_limit")}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.per_user_limit}
            onChange={(event) => setField("per_user_limit", event.target.value)}
            onBlur={blurHandler("per_user_limit")}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="pf-starts_at" required error={fieldError("starts_at")}>
          <Input
            type="datetime-local"
            value={values.starts}
            onChange={(event) => setField("starts", event.target.value)}
            onBlur={blurHandler("starts_at")}
          />
        </Field>
        <Field label="Selesai (WIB)" id="pf-ends_at" required error={fieldError("ends_at")}>
          <Input
            type="datetime-local"
            value={values.ends}
            onChange={(event) => setField("ends", event.target.value)}
            onBlur={blurHandler("ends_at")}
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={values.is_public}
          onChange={(checked) => setField("is_public", checked)}
          label={admin ? "Tampilkan di daftar voucher" : "Tampilkan di halaman toko"}
        />
        <span className="text-ink">{admin ? "Tampilkan di daftar voucher" : "Tampilkan di halaman toko"}</span>
        <span className="text-sm text-ink-muted">Bila mati, voucher tetap bisa dipakai dengan mengetik kodenya.</span>
      </div>
      {!admin && (
        <div className="flex items-center gap-3">
          <Switch
            checked={values.is_active}
            onChange={(checked) => setField("is_active", checked)}
            label="Promo aktif"
          />
          <span className="text-ink">Promo aktif</span>
        </div>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={saving} loadingText="Menyimpan…">
          Simpan promo
        </Button>
      </div>
    </form>
  );
}
