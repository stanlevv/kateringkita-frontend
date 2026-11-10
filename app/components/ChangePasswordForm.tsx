"use client";

import { useState } from "react";
import { changePassword } from "@/app/actions/account";
import { panggil } from "@/lib/aksi";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { cekField, changePasswordSchema } from "@/lib/schemas";

const KOSONG = { current_password: "", new_password: "", confirm: "" };
const LABEL: Record<string, string> = { current_password: "Kata sandi lama", new_password: "Kata sandi baru", confirm: "Ulangi kata sandi baru" };

/** PG-N2, PG-E2: formulir sendiri, terpisah dari simpan pengaturan toko. */
/** `onSelesai`: dipanggil setelah sandi diganti (admin dengan sandi sementara → muat ulang panel). */
export function ChangePasswordForm({ onSelesai }: { onSelesai?: () => void } = {}) {
  const [v, setV] = useState(KOSONG);
  const [tersentuh, setTersentuh] = useState<Set<string>>(new Set());
  const [dicoba, setDicoba] = useState(false);
  const [fokusKey, setFokusKey] = useState(0);
  const [server, setServer] = useState<Record<string, string>>({});
  const [mengirim, setMengirim] = useState(false);

  const semua = cekField(changePasswordSchema, v);
  if (v.confirm !== v.new_password) semua.confirm = "Konfirmasi kata sandi tidak sama.";
  const galatSemua = { ...server, ...semua };
  const galat = (k: string) => (dicoba || tersentuh.has(k) ? (galatSemua[k] ?? undefined) : undefined);
  const ringkasan = dicoba ? Object.entries(galatSemua).map(([k, m]) => ({ id: `pw-${k}`, message: `${LABEL[k] ?? k}: ${m}` })) : [];
  const set = (k: keyof typeof KOSONG, nilai: string) => { setServer({}); setV((p) => ({ ...p, [k]: nilai })); };
  const blur = (k: string) => () => setTersentuh((p) => new Set(p).add(k));

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(semua).length > 0) {
      setDicoba(true);
      setFokusKey((n) => n + 1);
      return;
    }
    if (mengirim) return;
    setMengirim(true);
    const r = await panggil(() => changePassword({ current_password: v.current_password, new_password: v.new_password }));
    setMengirim(false);
    if ("error" in r) {
      if (r.error.fields) {
        setServer(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
        setDicoba(true);
        setFokusKey((n) => n + 1);
      } else {
        toast({ tone: "danger", message: r.error.message });
      }
      return;
    }
    setV(KOSONG);
    setTersentuh(new Set());
    setDicoba(false);
    toast({ tone: "success", message: "Kata sandi diganti. Perangkat lain sudah dikeluarkan." });
    onSelesai?.();
  }

  return (
    <form onSubmit={kirim} noValidate className="flex max-w-md flex-col gap-4">
      <h3 className="font-semibold text-ink">Ganti kata sandi</h3>
      <ErrorSummary errors={ringkasan} focusKey={fokusKey} />
      <Field label="Kata sandi lama" id="pw-current_password" required error={galat("current_password")}>
        <Input type="password" autoComplete="current-password" value={v.current_password} onChange={(e) => set("current_password", e.target.value)} onBlur={blur("current_password")} />
      </Field>
      <Field label="Kata sandi baru" id="pw-new_password" required help="Minimal 8 karakter, mengandung huruf dan angka." error={galat("new_password")}>
        <Input type="password" autoComplete="new-password" value={v.new_password} onChange={(e) => set("new_password", e.target.value)} onBlur={blur("new_password")} />
      </Field>
      <Field label="Ulangi kata sandi baru" id="pw-confirm" required error={galat("confirm")}>
        <Input type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => set("confirm", e.target.value)} onBlur={blur("confirm")} />
      </Field>
      <div>
        <Button type="submit" loading={mengirim} loadingText="Menyimpan…">Ganti kata sandi</Button>
      </div>
    </form>
  );
}
