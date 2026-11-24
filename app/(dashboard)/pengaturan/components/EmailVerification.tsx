// Komponen EmailVerification: status email akun di Pengaturan > Akun, dengan dua alur kode OTP dari email:
// verifikasi email sekarang, dan ganti email (kode dikirim ke email baru, email baru berlaku setelah kodenya benar).
// Data dikirim lewat server action sendEmailCode dan verifyEmailCode (app/actions/account.ts).
// "use client": komponen ini berjalan di peramban karena memakai state dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MailWarning } from "lucide-react";
import { sendEmailCode, verifyEmailCode } from "@/app/actions/account";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import type { ActionResult } from "@/types/api";

// Tahap tampilan: hanya status, isi email baru, atau isi kode yang sudah dikirim ke `email`.
type Step = { name: "status" } | { name: "change" } | { name: "code"; email: string };

/**
 * Status dan pengelola email akun.
 * @param props.email    email akun saat ini (teks kosong bila belum ada)
 * @param props.verified apakah email sudah dibuktikan dengan kode OTP
 * @returns bagian `section` berisi status email dan formulir tahap yang sedang aktif
 */
export function EmailVerification({ email, verified }: { email: string; verified: boolean }) {
  // 1. State tahap, isian, galat per field, dan tanda sedang mengirim.
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "status" });
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // 2. Jalankan satu server action; galat per field ditampilkan di isian, galat umum menjadi toast.
  async function run<T>(action: () => Promise<ActionResult<T>>): Promise<T | null> {
    if (busy) return null;
    setBusy(true);
    setErrors({});
    const result = await callAction(action);
    setBusy(false);
    if ("error" in result) {
      if (result.error.fields) {
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return null;
    }
    return result.data;
  }

  // 3. Minta kode: tanpa isian untuk verifikasi email sekarang, atau dengan email baru dan sandi untuk ganti email.
  async function requestCode(input: { email: string; current_password: string } | null) {
    const sent = await run(() => sendEmailCode(input));
    if (!sent) return;
    setCode("");
    setStep({ name: "code", email: sent.email });
    toast({ tone: "success", message: `Kode dikirim ke ${sent.email}` });
  }

  // 4. Periksa kode; bila benar, kembali ke tampilan status dan muat ulang data server.
  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!(await run(() => verifyEmailCode(code)))) return;
    setStep({ name: "status" });
    setNewEmail("");
    setPassword("");
    toast({ tone: "success", message: "Email terverifikasi" });
    router.refresh();
  }

  return (
    <section aria-label="Email" className="flex max-w-md flex-col gap-3">
      <h3 className="font-semibold text-ink">Email</h3>
      <div className="flex flex-wrap items-center gap-3">
        <span className="break-all font-medium text-ink">{email || "Belum ada email"}</span>
        {email &&
          (verified ? (
            <Badge tone="success" icon={BadgeCheck}>
              Terverifikasi
            </Badge>
          ) : (
            <Badge tone="warning" icon={MailWarning}>
              Belum diverifikasi
            </Badge>
          ))}
      </div>

      {step.name === "status" && (
        <div className="flex flex-wrap gap-2">
          {email && !verified && (
            <Button onClick={() => requestCode(null)} loading={busy} loadingText="Mengirim…">
              Kirim kode verifikasi
            </Button>
          )}
          <Button variant="secondary" onClick={() => setStep({ name: "change" })} disabled={busy}>
            {email ? "Ganti email" : "Tambah email"}
          </Button>
        </div>
      )}

      {step.name === "change" && (
        <form
          noValidate
          aria-label="Ganti email"
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            requestCode({ email: newEmail, current_password: password });
          }}
        >
          <Field label="Email baru" id="email-baru" required error={errors.email}>
            <Input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
            />
          </Field>
          <Field label="Kata sandi saat ini" id="email-current_password" required error={errors.current_password}>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy} loadingText="Mengirim…">
              Kirim kode ke email baru
            </Button>
            <Button variant="secondary" onClick={() => setStep({ name: "status" })} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      )}

      {step.name === "code" && (
        <form noValidate aria-label="Masukkan kode" className="flex flex-col gap-3" onSubmit={submitCode}>
          <Field
            label="Kode verifikasi"
            id="email-code"
            required
            help={`6 angka yang dikirim ke ${step.email}. Berlaku 10 menit.`}
            error={errors.code}
          >
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy} loadingText="Memeriksa…">
              Verifikasi
            </Button>
            <Button variant="secondary" onClick={() => setStep({ name: "status" })} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
