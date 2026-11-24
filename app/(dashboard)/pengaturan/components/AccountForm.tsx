// Komponen AccountForm: formulir ubah nama pemilik dan nomor WA login di Pengaturan > Akun.
// Data dikirim lewat server action updateAccount (app/actions/account.ts) ke PATCH /me. Email diubah di
// EmailVerification, bukan di sini, karena email baru harus dibuktikan dengan kode OTP.
// "use client": komponen ini berjalan di peramban karena memakai state dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAccount } from "@/app/actions/account";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { accountSchema, validateFields } from "@/lib/schemas";

/**
 * Formulir data akun. Kolom kata sandi saat ini baru muncul bila nomor WA diubah, karena nomor dipakai untuk login.
 * @param props.fullName nama pemilik saat ini
 * @param props.phone    nomor WA login saat ini
 * @returns elemen `form`
 */
export function AccountForm({ fullName, phone }: { fullName: string; phone: string }) {
  // 1. State isian dan galat (galat server menimpa galat browser untuk field yang sama).
  const router = useRouter();
  const [values, setValues] = useState({ full_name: fullName, phone, current_password: "" });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const phoneChanged = values.phone !== phone;
  const dirty = values.full_name.trim() !== fullName || phoneChanged;
  const errors: Record<string, string> = { ...validateFields(accountSchema, values), ...serverErrors };
  if (phoneChanged && !values.current_password) errors.current_password = "Kata sandi saat ini wajib diisi.";
  const errorFor = (field: string) => (submitAttempted ? errors[field] : undefined);
  const setField = (field: keyof typeof values, value: string) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  async function submit(event: React.FormEvent) {
    // 1. Tanpa perubahan atau masih ada galat: jangan kirim.
    event.preventDefault();
    setSubmitAttempted(true);
    if (!dirty || saving || Object.keys(errors).length > 0) return;
    // 2. Kirim; galat per field dari server ditampilkan di bawah isiannya, galat umum menjadi toast.
    setSaving(true);
    const result = await callAction(() => updateAccount(values));
    setSaving(false);
    if ("error" in result) {
      if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    // 3. Berhasil: kosongkan sandi, lalu muat ulang data server (nama di header ikut berubah).
    setValues((previous) => ({ ...previous, current_password: "" }));
    setSubmitAttempted(false);
    toast({ tone: "success", message: "Data akun disimpan" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Data akun" className="flex max-w-md flex-col gap-4">
      <h3 className="font-semibold text-ink">Data akun</h3>
      <Field label="Nama pemilik" id="akun-full_name" required error={errorFor("full_name")}>
        <Input
          autoComplete="name"
          value={values.full_name}
          onChange={(event) => setField("full_name", event.target.value)}
        />
      </Field>
      <Field label="Nomor WA login" id="akun-phone" required help="Diawali 08, 10–13 digit." error={errorFor("phone")}>
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value.replace(/\D/g, ""))}
        />
      </Field>
      {phoneChanged && (
        <Field
          label="Kata sandi saat ini"
          id="akun-current_password"
          required
          help="Wajib karena nomor WA dipakai untuk masuk."
          error={errorFor("current_password")}
        >
          <Input
            type="password"
            autoComplete="current-password"
            value={values.current_password}
            onChange={(event) => setField("current_password", event.target.value)}
          />
        </Field>
      )}
      <div>
        <Button type="submit" loading={saving} loadingText="Menyimpan…" disabled={!dirty}>
          Simpan data akun
        </Button>
      </div>
    </form>
  );
}
