"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCustomerServiceContact } from "@/app/actions/admin/promos";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";

/** Kontak CS (WhatsApp) yang tampil di aplikasi pembeli lewat GET /meta/settings. Kosong = belum diatur. */
export function CustomerServiceContactForm({ value }: { value: string }) {
  const router = useRouter();
  const [text, setText] = useState(value);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const phone = text.trim();
    if (phone && !/^08\d{8,11}$/.test(phone)) return setError("Nomor WA harus diawali 08 dan 10–13 digit.");
    setError(undefined);
    if (phone === value) return void toast({ tone: "info", message: "Tidak ada perubahan" });
    setSaving(true);
    const result = await callAction(() => saveCustomerServiceContact(phone));
    setSaving(false);
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: phone ? "Kontak CS disimpan" : "Kontak CS dikosongkan" });
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Kontak CS"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <h2 className="text-lg font-semibold text-ink">Kontak CS</h2>
      <p className="text-ink-muted">Nomor WhatsApp layanan pelanggan yang tampil di aplikasi pembeli.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <Field label="Nomor WhatsApp" id="cs-wa" help="Diawali 08. Kosongkan untuk menyembunyikan." error={error}>
            <Input
              type="tel"
              inputMode="numeric"
              value={text}
              onChange={(event) => {
                setError(undefined);
                setText(event.target.value);
              }}
            />
          </Field>
        </div>
        <Button type="submit" loading={saving} loadingText="Menyimpan…">
          Simpan
        </Button>
      </div>
    </form>
  );
}
