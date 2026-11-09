"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, ExternalLink, KeyRound, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { hapusPenyediaAi, tambahPenyediaAi, ubahPenyediaAi, ujiPenyediaAi } from "@/app/actions/admin/ai";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, fokus } from "@/app/components/ui/cx";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { INFO_AI, JENIS_AI, statusAi } from "@/lib/ai";
import { panggil } from "@/lib/aksi";
import { formatJam, formatTanggal } from "@/lib/format";
import type { DaftarAi, HasilUjiAi, JenisAi, PenyediaAi } from "@/types/ai";

const waktu = (iso: string) => `${formatTanggal(iso)}, ${formatJam(iso)}`;

function Formulir({ awal, onSelesai }: { awal: PenyediaAi | null; onSelesai: () => void }) {
  const [jenis, setJenis] = useState<JenisAi>(awal?.provider ?? "gemini");
  const [label, setLabel] = useState(awal?.label ?? INFO_AI.gemini.nama);
  const [model, setModel] = useState(awal?.model ?? INFO_AI.gemini.contoh[0]);
  const [kunci, setKunci] = useState("");
  const [prioritas, setPrioritas] = useState(String(awal?.priority ?? 100));
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [kirim, setKirim] = useState(false);
  const info = INFO_AI[jenis];

  function pilih(j: JenisAi) {
    setJenis(j);
    setLabel(INFO_AI[j].nama);
    setModel(INFO_AI[j].contoh[0]);
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setKirim(true);
    const isi = { label, model, priority: Number(prioritas), ...(kunci.trim() ? { api_key: kunci.trim() } : {}) };
    const r = await panggil(() => (awal ? ubahPenyediaAi(awal.id, isi) : tambahPenyediaAi({ ...isi, provider: jenis, api_key: kunci.trim(), is_active: true })));
    setKirim(false);
    if ("error" in r) {
      setGalat(Object.fromEntries(Object.entries(r.error.fields ?? {}).map(([k, v]) => [k, v[0]])));
      if (!r.error.fields) toast({ tone: "danger", message: r.error.message });
      return;
    }
    toast({ tone: "success", message: awal ? "Penyedia AI disimpan" : "Penyedia AI ditambahkan" });
    onSelesai();
  }

  return (
    <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
      <fieldset disabled={!!awal} className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Penyedia</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {JENIS_AI.map((j) => (
            <label key={j} className={cx("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 has-[:disabled]:cursor-default",
              jenis === j ? "border-accent bg-primary-soft font-semibold" : "border-line bg-surface")}>
              <input type="radio" name="penyedia" value={j} checked={jenis === j} onChange={() => pilih(j)} className={cx("size-4 accent-primary", fokus)} />
              {INFO_AI[j].nama}
            </label>
          ))}
        </div>
        {awal && <p className="text-xs text-ink-muted">Jenis penyedia tidak bisa diganti. Tambahkan penyedia baru bila perlu.</p>}
      </fieldset>
      <a href={info.kunci} target="_blank" rel="noopener noreferrer" className={cx("inline-flex items-center gap-1 self-start text-sm font-medium text-primary underline", fokus)}>
        Buat API key gratis di {info.nama}<ExternalLink aria-hidden className="size-3.5" />
      </a>
      <Field label="Nama" id="ai-label" required error={galat.label}>
        <Input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label="Model" id="ai-model" required help={`Contoh: ${info.contoh.join(", ")}. Nama model bisa berubah, cek halaman penyedia.`} error={galat.model}>
        <Input value={model} maxLength={120} list="ai-model-contoh" onChange={(e) => setModel(e.target.value)} />
      </Field>
      <datalist id="ai-model-contoh">{info.contoh.map((m) => <option key={m} value={m} />)}</datalist>
      <Field label="API key" id="ai-key" required={!awal} error={galat.api_key}
        help={awal ? `Tersimpan: ••••${awal.key_hint}. Kosongkan bila tidak diganti.` : "Disimpan terenkripsi dan tidak bisa dilihat lagi setelah disimpan."}>
        <Input type="password" autoComplete="off" spellCheck={false} value={kunci} onChange={(e) => setKunci(e.target.value)} />
      </Field>
      <Field label="Prioritas" id="ai-prioritas" required help="Angka kecil dicoba lebih dulu (1–1000)." error={galat.priority}>
        <Input type="number" inputMode="numeric" min={1} max={1000} value={prioritas} onChange={(e) => setPrioritas(e.target.value)} />
      </Field>
      <Button type="submit" loading={kirim} loadingText="Menyimpan…">{awal ? "Simpan perubahan" : "Tambah penyedia"}</Button>
    </form>
  );
}

function StatusChip({ p }: { p: PenyediaAi }) {
  const s = statusAi(p);
  if (s.jenis === "nonaktif") return <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-ink-muted">Nonaktif</span>;
  if (s.jenis === "istirahat") return <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning">Istirahat s.d. {formatJam(s.sampai)}</span>;
  return <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success">Siap dipakai</span>;
}

export function PenyediaAiPanel({ data }: { data: DaftarAi }) {
  const router = useRouter();
  const [form, setForm] = useState<{ awal: PenyediaAi | null } | null>(null);
  const [hapus, setHapus] = useState<PenyediaAi | null>(null);
  const [uji, setUji] = useState<Record<number, HasilUjiAi | "memuat">>({});

  async function aktif(p: PenyediaAi, v: boolean) {
    const r = await panggil(() => ubahPenyediaAi(p.id, { is_active: v }));
    if ("error" in r) return void toast({ tone: "danger", message: r.error.message });
    router.refresh();
  }

  async function cek(p: PenyediaAi) {
    setUji((u) => ({ ...u, [p.id]: "memuat" }));
    const r = await panggil(() => ujiPenyediaAi(p.id));
    setUji((u) => ({ ...u, [p.id]: "data" in r ? r.data : { ok: false, message: r.error.message } }));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles aria-hidden className="size-5 text-primary" />Cara kerja</h2>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-ink-muted">
          <li>Asisten AI mencoba penyedia aktif dari prioritas terkecil.</li>
          <li>Bila kena batas kuota (429), key ditolak, error, atau tidak menjawab, penyedia itu diistirahatkan sebentar dan penyedia berikutnya dicoba.</li>
          <li>Pakai key gratis milik sendiri dari tiap penyedia. API key disimpan terenkripsi dan tidak pernah ditampilkan lagi.</li>
        </ol>
        <p className="text-sm">
          Cadangan terakhir: {data.env_gemini
            ? <span className="font-medium text-success">GEMINI_API_KEY di server aktif (model {data.env_gemini.model})</span>
            : <span className="text-ink-muted">tidak ada (GEMINI_API_KEY di server kosong)</span>}
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Urutan penyedia</h2>
        <Button onClick={() => setForm({ awal: null })}><Plus aria-hidden className="size-4" />Tambah penyedia</Button>
      </div>

      {data.providers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
          Belum ada penyedia. Tambahkan minimal satu, misalnya Google Gemini dengan key gratis dari AI Studio.
        </p>
      ) : (
        <ol aria-label="Urutan penyedia" className="flex flex-col gap-3">
          {data.providers.map((p, i) => {
            const u = uji[p.id];
            return (
              <li key={p.id} className={cx("flex flex-col gap-3 rounded-lg border bg-surface p-4", p.is_active ? "border-line" : "border-dashed border-line opacity-70")}>
                <div className="flex flex-wrap items-start gap-3">
                  <span aria-label={`Urutan ${i + 1}`} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-steel font-mono font-bold text-on-steel">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{p.label}<StatusChip p={p} /></p>
                    <p className="text-sm text-ink-muted">{p.provider_name} · prioritas {p.priority}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-mono">{p.model}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-ink-muted"><KeyRound aria-hidden className="size-3.5" />••••{p.key_hint}</span>
                    </p>
                  </div>
                  <Switch checked={p.is_active} onChange={(v) => void aktif(p, v)} label={`Aktifkan ${p.label}`} />
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  {p.last_ok_at && <p className="text-ink-muted">Terakhir berhasil: {waktu(p.last_ok_at)}</p>}
                  {p.last_error && p.last_error_at && <p className="text-danger">Error terakhir ({waktu(p.last_error_at)}): {p.last_error}</p>}
                  {u && u !== "memuat" && (
                    <p role="status" className={cx("inline-flex items-center gap-1.5 font-medium", u.ok ? "text-success" : "text-danger")}>
                      {u.ok ? <CircleCheck aria-hidden className="size-4" /> : <CircleX aria-hidden className="size-4" />}
                      {u.ok ? `Tersambung (${u.ms} ms): “${u.sample}”` : u.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void cek(p)} disabled={u === "memuat"}>
                    {u === "memuat" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}Uji koneksi
                  </Button>
                  <Button variant="secondary" onClick={() => setForm({ awal: p })}><Pencil aria-hidden className="size-4" />Ubah</Button>
                  <Button variant="ghost" className="text-danger" onClick={() => setHapus(p)}><Trash2 aria-hidden className="size-4" />Hapus</Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.awal ? `Ubah ${form.awal.label}` : "Tambah penyedia AI"}>
        {form && <Formulir key={form.awal?.id ?? "baru"} awal={form.awal} onSelesai={() => { setForm(null); router.refresh(); }} />}
      </Dialog>

      <ConfirmDialog
        open={!!hapus}
        onClose={() => setHapus(null)}
        title={`Hapus ${hapus?.label ?? ""}?`}
        body="API key penyedia ini ikut terhapus dan tidak bisa dikembalikan. Asisten AI memakai penyedia lain yang aktif."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={async () => {
          const p = hapus;
          setHapus(null);
          if (!p) return;
          const r = await panggil(() => hapusPenyediaAi(p.id));
          if ("error" in r) return void toast({ tone: "danger", message: r.error.message });
          toast({ tone: "success", message: `${p.label} dihapus` });
          router.refresh();
        }}
      />
    </div>
  );
}
