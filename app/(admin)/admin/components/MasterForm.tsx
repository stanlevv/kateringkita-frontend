"use client";

import { useState } from "react";
import { saveMaster } from "@/app/actions/admin/master";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { validateMaster, type MASTER_TABS } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";

/** A-01…A-03 — isi dialog tambah/ubah data master. `item` ada = mode ubah. */
export function MasterForm({
  tab,
  item,
  onSaved,
  onClose,
}: {
  tab: (typeof MASTER_TABS)[number];
  item: MasterItem | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const extraField = tab.extraField;
  const [name, setName] = useState(item?.name ?? "");
  const [extra, setExtra] = useState((extraField && item?.[extraField]) || "");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const input = { name, ...(extraField ? { [extraField]: extra } : {}) };
  const localErrors = validateMaster(tab.kind, input);
  const errorFor = (field: string) => (submitAttempted ? (localErrors[field] ?? serverErrors[field]) : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(localErrors).length > 0) return setSubmitAttempted(true);
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveMaster(tab.kind, item?.id ?? null, input));
    setSaving(false);
    if ("error" in result) {
      if (result.error.code === "CONFLICT") {
        setServerErrors({ name: result.error.message });
        setSubmitAttempted(true);
      } else if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
        setSubmitAttempted(true);
      }
      toast({ tone: "danger", message: result.error.message }); // 409 nama kembar: pesan backend apa adanya
      return;
    }
    toast({ tone: "success", message: item ? "Perubahan disimpan" : "Data ditambahkan" });
    onSaved();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Nama" id="mf-name" required error={errorFor("name")}>
        <Input
          value={name}
          maxLength={tab.nameMax}
          onChange={(event) => {
            setServerErrors({});
            setName(event.target.value);
          }}
          autoFocus
        />
      </Field>
      {extraField && (
        <Field
          label={tab.extraFieldLabel!}
          id={`mf-${extraField}`}
          help={extraField === "icon" ? "Nama ikon, boleh dikosongkan." : "Boleh dikosongkan."}
          error={errorFor(extraField)}
        >
          <Input
            value={extra}
            maxLength={tab.extraFieldMax}
            onChange={(event) => {
              setServerErrors({});
              setExtra(event.target.value);
            }}
          />
        </Field>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={saving} loadingText="Menyimpan…">
          Simpan
        </Button>
      </div>
    </form>
  );
}
