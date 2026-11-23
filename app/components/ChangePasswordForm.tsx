// Komponen ChangePasswordForm: formulir ganti kata sandi akun yang sedang masuk.
// Dipakai Pengaturan penjual, halaman Akun admin, dan layar wajib ganti sandi admin. Data dikirim lewat server
// action changePassword (app/actions/account.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { changePassword } from "@/app/actions/account";
import { callAction } from "@/lib/action";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { validateFields, changePasswordSchema } from "@/lib/schemas";

const EMPTY_FORM = { current_password: "", new_password: "", confirm: "" };
const FIELD_LABELS: Record<string, string> = {
  current_password: "Kata sandi lama",
  new_password: "Kata sandi baru",
  confirm: "Ulangi kata sandi baru",
};

/**
 * Formulir ganti kata sandi, terpisah dari tombol simpan pengaturan toko. Galat tampil di bawah isian setelah
 * isian disentuh, dan ringkasan galat muncul di atas saat formulir dikirim.
 * @param props.onPasswordChanged dipanggil setelah sandi berhasil diganti (opsional; admin dengan sandi sementara
 * memakainya untuk memuat ulang panel)
 * @returns elemen `form`
 */
export function ChangePasswordForm({ onPasswordChanged }: { onPasswordChanged?: () => void } = {}) {
  // 1. State isian, isian yang sudah disentuh, dan galat dari server.
  const [values, setValues] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 2. Hitung galat dari aturan formulir (dan konfirmasi sandi yang harus sama), lalu gabungkan dengan galat server.
  const clientErrors = validateFields(changePasswordSchema, values);
  if (values.confirm !== values.new_password) clientErrors.confirm = "Konfirmasi kata sandi tidak sama.";
  const allErrors = { ...serverErrors, ...clientErrors };
  const errorFor = (field: string) =>
    submitAttempted || touched.has(field) ? (allErrors[field] ?? undefined) : undefined;
  const summaryErrors = submitAttempted
    ? Object.entries(allErrors).map(([field, message]) => ({
        id: `pw-${field}`,
        message: `${FIELD_LABELS[field] ?? field}: ${message}`,
      }))
    : [];
  // 3. Pengubah isian: setiap ketikan menghapus galat server lama.
  const setField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  const blur = (field: string) => () => setTouched((previous) => new Set(previous).add(field));

  async function submit(event: React.FormEvent) {
    // 1. Masih ada galat: tampilkan ringkasan dan pindahkan fokus ke sana.
    event.preventDefault();
    if (Object.keys(clientErrors).length > 0) {
      setSubmitAttempted(true);
      setFocusKey((count) => count + 1);
      return;
    }
    // 2. Kirim sekali saja (abaikan klik kedua selama mengirim).
    if (submitting) return;
    setSubmitting(true);
    const result = await callAction(() =>
      changePassword({ current_password: values.current_password, new_password: values.new_password }),
    );
    setSubmitting(false);
    // 3. Gagal: galat per isian dari server, atau toast untuk galat umum.
    if ("error" in result) {
      if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
        setSubmitAttempted(true);
        setFocusKey((count) => count + 1);
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    // 4. Berhasil: kosongkan formulir, beri tahu pengguna, lalu panggil onPasswordChanged.
    setValues(EMPTY_FORM);
    setTouched(new Set());
    setSubmitAttempted(false);
    toast({ tone: "success", message: "Kata sandi diganti. Perangkat lain sudah dikeluarkan." });
    onPasswordChanged?.();
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-md flex-col gap-4">
      <h3 className="font-semibold text-ink">Ganti kata sandi</h3>
      <ErrorSummary errors={summaryErrors} focusKey={focusKey} />
      <Field label="Kata sandi lama" id="pw-current_password" required error={errorFor("current_password")}>
        <Input
          type="password"
          autoComplete="current-password"
          value={values.current_password}
          onChange={(event) => setField("current_password", event.target.value)}
          onBlur={blur("current_password")}
        />
      </Field>
      <Field
        label="Kata sandi baru"
        id="pw-new_password"
        required
        help="Minimal 8 karakter, mengandung huruf dan angka."
        error={errorFor("new_password")}
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={values.new_password}
          onChange={(event) => setField("new_password", event.target.value)}
          onBlur={blur("new_password")}
        />
      </Field>
      <Field label="Ulangi kata sandi baru" id="pw-confirm" required error={errorFor("confirm")}>
        <Input
          type="password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={(event) => setField("confirm", event.target.value)}
          onBlur={blur("confirm")}
        />
      </Field>
      <div>
        <Button type="submit" loading={submitting} loadingText="Menyimpan…">
          Ganti kata sandi
        </Button>
      </div>
    </form>
  );
}
