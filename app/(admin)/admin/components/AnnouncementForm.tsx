// Komponen AnnouncementForm: formulir pengumuman di /admin/pengumuman (penerima, judul, isi). Pengumuman dikirim
// sebagai notifikasi aplikasi lewat server action sendAnnouncement (app/actions/admin/announcements.ts,
// POST /admin/broadcasts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state.
"use client";

import { useState } from "react";
import { sendAnnouncement, type AnnouncementAudience } from "@/app/actions/admin/announcements";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Field } from "@/app/components/ui/Field";
import { Input, Select, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";

// Pilihan penerima (nilai dikirim ke API) dan labelnya.
const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: "Semua pembeli dan penjual",
  customer: "Semua pembeli",
  merchant: "Semua penjual",
};

/**
 * Formulir kirim pengumuman. Dikonfirmasi dulu karena pengumuman tidak bisa ditarik kembali. Setelah terkirim, judul
 * dan isi dikosongkan (penerima tetap).
 * @returns formulir dengan dialog konfirmasi
 */
export function AnnouncementForm() {
  // 1. Isian (kuncinya sama dengan field API), galat per isian, dialog konfirmasi, dan tanda sibuk.
  const [values, setValues] = useState<{ audience: AnnouncementAudience; title: string; body: string }>({
    audience: "customer",
    title: "",
    body: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 2. Tombol kirim: periksa judul dan isi wajib, lalu buka konfirmasi.
  function validate(event: React.FormEvent) {
    event.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) newErrors.title = "Judul wajib diisi.";
    if (!values.body.trim()) newErrors.body = "Isi wajib diisi.";
    setErrors(newErrors);
    if (!Object.keys(newErrors).length) setConfirmOpen(true);
  }

  // 3. Setelah dikonfirmasi: kirim; galat per isian dari backend ditampilkan di isiannya.
  async function submit() {
    // 1. Kirim lalu tutup konfirmasi.
    setBusy(true);
    const result = await callAction(() => sendAnnouncement(values));
    setBusy(false);
    setConfirmOpen(false);
    // 2. Gagal: tandai isian dan toast. Berhasil: toast jumlah akun penerima, kosongkan judul dan isi.
    if ("error" in result) {
      if (result.error.fields)
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      return void toast({ tone: "danger", message: result.error.message });
    }
    toast({ tone: "success", message: `Pengumuman terkirim ke ${result.data.sent} akun.` });
    setValues((previous) => ({ ...previous, title: "", body: "" }));
  }

  return (
    <form
      onSubmit={validate}
      noValidate
      aria-label="Kirim pengumuman"
      className="flex max-w-2xl flex-col gap-4 rounded-lg border border-line bg-surface p-4"
    >
      <Field label="Penerima" id="audience">
        <Select
          value={values.audience}
          onChange={(event) =>
            setValues((previous) => ({ ...previous, audience: event.target.value as AnnouncementAudience }))
          }
        >
          {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((audience) => (
            <option key={audience} value={audience}>
              {AUDIENCE_LABELS[audience]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Judul" id="judul" required error={errors.title} help={`${values.title.length}/120`}>
        <Input
          maxLength={120}
          value={values.title}
          onChange={(event) => setValues((previous) => ({ ...previous, title: event.target.value }))}
        />
      </Field>
      <Field label="Isi" id="isi" required error={errors.body} help={`${values.body.length}/255`}>
        <Textarea
          rows={3}
          maxLength={255}
          value={values.body}
          onChange={(event) => setValues((previous) => ({ ...previous, body: event.target.value }))}
        />
      </Field>
      <Button type="submit" className="self-start">
        Kirim pengumuman
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Kirim pengumuman"
        tone="primary"
        confirmLabel="Kirim"
        busy={busy}
        body={`Kirim "${values.title.trim()}" ke ${AUDIENCE_LABELS[values.audience].toLowerCase()}? Pengumuman tidak bisa ditarik kembali.`}
        onConfirm={submit}
      />
    </form>
  );
}
