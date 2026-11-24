// Komponen MasterForm: isi dialog tambah/ubah satu data master (nama, plus ikon atau keterangan bila tab memilikinya).
// Disimpan lewat server action saveMaster (app/actions/admin/master.ts); aturan isian dari validateMaster
// (services/admin-master.service.ts), sama dengan yang dipakai server action.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state.
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

/**
 * Isi dialog tambah/ubah data master. Galat baru tampil setelah tombol Simpan pernah ditekan.
 * @param props.tab tab data master (jenis data, kolom tambahan, batas panjang)
 * @param props.item data yang diubah; null = tambah baru
 * @param props.onSaved dipanggil setelah tersimpan
 * @param props.onClose menutup dialog
 * @returns formulir
 */
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
  // 1. Isian (nama dan kolom tambahan), tanda sudah dicoba kirim, galat dari server, dan tanda sedang menyimpan.
  const extraField = tab.extraField;
  const [name, setName] = useState(item?.name ?? "");
  const [extra, setExtra] = useState((extraField && item?.[extraField]) || "");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 2. Periksa isian di peramban; galat lokal didahulukan, lalu galat dari server.
  const input = { name, ...(extraField ? { [extraField]: extra } : {}) };
  const localErrors = validateMaster(tab.kind, input);
  const errorFor = (field: string) => (submitAttempted ? (localErrors[field] ?? serverErrors[field]) : undefined);

  // 3. Simpan ke server.
  async function submit(event: React.FormEvent) {
    // 1. Isian belum sah: tampilkan galat tanpa memanggil server. Cegah kirim ganda.
    event.preventDefault();
    if (Object.keys(localErrors).length > 0) return setSubmitAttempted(true);
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveMaster(tab.kind, item?.id ?? null, input));
    setSaving(false);
    // 2. Gagal: 409 CONFLICT (nama kembar) ditandai di isian nama; galat per isian ditandai di isiannya.
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
      toast({ tone: "danger", message: result.error.message }); // pesan backend apa adanya (mis. nama kembar)
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
