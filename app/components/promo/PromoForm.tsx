"use client";

import { useState } from "react";
import { savePromo } from "@/app/actions/promos";
import { panggil } from "@/lib/aksi";
import { Button } from "@/app/components/ui/Button";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { inputWibKeIso, isoKeInputWib } from "@/lib/format";
import { cekPromo } from "@/lib/schemas";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const LABEL: Record<string, string> = {
  code: "Kode promo", description: "Deskripsi", type: "Jenis promo", value: "Nilai", max_discount: "Maks potongan", min_subtotal: "Min belanja",
  quota: "Kuota", per_user_limit: "Batas per pembeli", starts_at: "Mulai", ends_at: "Selesai",
};
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const opsional = (s: string) => (s.trim() === "" ? null : Number(s));

type Isian = { code: string; description: string; type: Promo["type"]; value: string; max_discount: string; min_subtotal: string; quota: string; per_user_limit: string; starts: string; ends: string; is_active: boolean };

const awalDari = (p?: Promo | null): Isian => {
  const sekarang = new Date().toISOString();
  return {
    code: p?.code ?? "",
    description: p?.description ?? "",
    type: p?.type ?? "percent",
    value: p ? String(p.value) : "",
    max_discount: p?.max_discount ? String(p.max_discount) : "",
    min_subtotal: String(p?.min_subtotal ?? 0),
    quota: p?.quota != null ? String(p.quota) : "",
    per_user_limit: String(p?.per_user_limit ?? 1),
    starts: isoKeInputWib(p?.starts_at ?? sekarang),
    ends: isoKeInputWib(p?.ends_at ?? new Date(Date.now() + 30 * 86400e3).toISOString()),
    is_active: p?.is_active ?? true,
  };
};

/** M-13, PR-N2/N3/E1/E2: isi dialog buat/ubah promo. `promo` ada = mode ubah. */
export function PromoForm({ promo, onSaved, onClose, simpan = savePromo, admin }: { promo?: Promo | null; onSaved: (p: Promo) => void; onClose: () => void; simpan?: (id: number | null, input: unknown) => Promise<ActionResult<Promo>>; admin?: boolean }) {
  const [v, setV] = useState<Isian>(() => awalDari(promo));
  const [tersentuh, setTersentuh] = useState<Set<string>>(new Set());
  const [dicoba, setDicoba] = useState(false);
  const [fokusKey, setFokusKey] = useState(0);
  const [server, setServer] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);

  const set = <K extends keyof Isian>(k: K, nilai: Isian[K]) => { setServer({}); setV((p) => ({ ...p, [k]: nilai })); };
  const blur = (k: string) => () => setTersentuh((p) => new Set(p).add(k));

  const persen = v.type === "percent";
  const input = {
    code: v.code, description: v.description, type: v.type,
    value: v.type === "free_service_fee" ? 0 : num(v.value),
    max_discount: persen ? opsional(v.max_discount) : null,
    min_subtotal: num(v.min_subtotal), quota: opsional(v.quota), per_user_limit: num(v.per_user_limit),
    starts_at: inputWibKeIso(v.starts), ends_at: inputWibKeIso(v.ends), is_active: v.is_active,
  };
  const semua = cekPromo(input, promo?.used_count ?? 0);
  const galatSemua = dicoba ? { ...server, ...semua } : semua;
  const galat = (k: string) => (dicoba || tersentuh.has(k) ? galatSemua[k] : undefined);
  const ringkasan = dicoba ? Object.entries(galatSemua).map(([k, m]) => ({ id: `pf-${k}`, message: `${LABEL[k] ?? k}: ${m}` })) : [];

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(semua).length > 0) {
      setDicoba(true);
      setFokusKey((n) => n + 1);
      return;
    }
    if (menyimpan) return;
    setMenyimpan(true);
    const r = await panggil(() => simpan(promo?.id ?? null, input));
    setMenyimpan(false);
    if ("error" in r) {
      if (r.error.fields) { // PR-E1
        setServer(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
        setDicoba(true);
        setFokusKey((n) => n + 1);
      } else {
        toast({ tone: "danger", message: r.error.message });
      }
      return;
    }
    toast({ tone: "success", message: "Promo disimpan" });
    onSaved(r.data);
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      <ErrorSummary errors={ringkasan} focusKey={fokusKey} />
      <Field label="Kode promo" id="pf-code" required help={admin && promo ? "Kode tidak bisa diubah." : "3–30 huruf besar atau angka, tanpa spasi."} error={galat("code")}>
        <Input value={v.code} maxLength={30} readOnly={admin && !!promo} onChange={(e) => set("code", e.target.value.toUpperCase())} onBlur={blur("code")} className="font-mono" />
      </Field>
      <Field label="Deskripsi" id="pf-description" error={galat("description")}>
        <Input value={v.description} maxLength={255} onChange={(e) => set("description", e.target.value)} onBlur={blur("description")} />
      </Field>
      <Field label="Jenis promo" id="pf-type" required error={galat("type")}>
        <Select value={v.type} onChange={(e) => set("type", e.target.value as Promo["type"])} onBlur={blur("type")}>
          <option value="percent">Persen</option>
          <option value="fixed">Potongan Rupiah</option>
          <option value="free_service_fee">Gratis biaya layanan</option>
        </Select>
      </Field>
      {v.type !== "free_service_fee" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={persen ? "Nilai (%)" : "Nilai (Rp)"} id="pf-value" required error={galat("value")}>
            <Input type="number" inputMode="numeric" min={1} step={1} value={v.value} onChange={(e) => set("value", e.target.value)} onBlur={blur("value")} />
          </Field>
          {persen && (
            <Field label="Maks potongan (Rp)" id="pf-max_discount" help="Kosongkan bila tanpa batas." error={galat("max_discount")}>
              <Input type="number" inputMode="numeric" min={1} step={1} value={v.max_discount} onChange={(e) => set("max_discount", e.target.value)} onBlur={blur("max_discount")} />
            </Field>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min belanja (Rp)" id="pf-min_subtotal" required error={galat("min_subtotal")}>
          <Input type="number" inputMode="numeric" min={0} step={1} value={v.min_subtotal} onChange={(e) => set("min_subtotal", e.target.value)} onBlur={blur("min_subtotal")} />
        </Field>
        <Field label="Kuota" id="pf-quota" help="Kosong = tanpa batas." error={galat("quota")}>
          <Input type="number" inputMode="numeric" min={1} step={1} value={v.quota} onChange={(e) => set("quota", e.target.value)} onBlur={blur("quota")} />
        </Field>
        <Field label="Batas per pembeli" id="pf-per_user_limit" required error={galat("per_user_limit")}>
          <Input type="number" inputMode="numeric" min={1} step={1} value={v.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} onBlur={blur("per_user_limit")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="pf-starts_at" required error={galat("starts_at")}>
          <Input type="datetime-local" value={v.starts} onChange={(e) => set("starts", e.target.value)} onBlur={blur("starts_at")} />
        </Field>
        <Field label="Selesai (WIB)" id="pf-ends_at" required error={galat("ends_at")}>
          <Input type="datetime-local" value={v.ends} onChange={(e) => set("ends", e.target.value)} onBlur={blur("ends_at")} />
        </Field>
      </div>
      {!admin && (
        <div className="flex items-center gap-3">
          <Switch checked={v.is_active} onChange={(x) => set("is_active", x)} label="Promo aktif" />
          <span className="text-ink">Promo aktif</span>
        </div>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button type="submit" loading={menyimpan} loadingText="Menyimpan…">Simpan promo</Button>
      </div>
    </form>
  );
}
