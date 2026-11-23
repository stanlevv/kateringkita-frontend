// Komponen AiProvidersPanel: bagian penyedia AI di /admin/ai. Menjelaskan cara kerja urutan fallback, lalu menampilkan
// daftar penyedia sesuai prioritas dengan status (siap, istirahat, nonaktif), sakelar aktif, uji koneksi, ubah, dan
// hapus. Uji koneksi = mengirim satu permintaan kecil ke penyedia untuk memastikan API key dan modelnya bekerja.
// Data dari GET /admin/ai-providers (diambil page.tsx); perubahan lewat server action di app/actions/admin/ai.ts.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, dialog, dan router.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, ExternalLink, KeyRound, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { deleteAiProvider, createAiProvider, updateAiProvider, testAiProvider } from "@/app/actions/admin/ai";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { AI_PROVIDER_INFO, AI_PROVIDER_TYPES, aiProviderStatus } from "@/lib/ai";
import { callAction } from "@/lib/action";
import { formatTime, formatDate } from "@/lib/format";
import type { AiProviderList, AiTestResult, AiProviderType, AiProvider } from "@/types/ai";

// Waktu lengkap tanpa "WIB", mis. "13 Nov 2026, 09.55".
const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;

/**
 * Formulir tambah atau ubah penyedia AI di dalam dialog. Saat mengubah, jenis penyedia dikunci dan API key boleh
 * dikosongkan (key lama tetap dipakai).
 * @param props.initial penyedia yang diubah, atau null untuk menambah
 * @param props.onDone dipanggil setelah tersimpan
 * @returns form
 */
function ProviderForm({ initial, onDone }: { initial: AiProvider | null; onDone: () => void }) {
  // 1. Isian awal: dari penyedia yang diubah, atau Gemini dengan contoh model pertamanya.
  const [providerType, setProviderType] = useState<AiProviderType>(initial?.provider ?? "gemini");
  const [label, setLabel] = useState(initial?.label ?? AI_PROVIDER_INFO.gemini.name);
  const [model, setModel] = useState(initial?.model ?? AI_PROVIDER_INFO.gemini.exampleModels[0]);
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(String(initial?.priority ?? 100));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const info = AI_PROVIDER_INFO[providerType];

  // 2. Ganti jenis penyedia: nama dan model ikut diisi dengan bawaan jenis itu.
  function selectProvider(type: AiProviderType) {
    setProviderType(type);
    setLabel(AI_PROVIDER_INFO[type].name);
    setModel(AI_PROVIDER_INFO[type].exampleModels[0]);
  }

  // 3. Simpan.
  async function save(event: FormEvent) {
    // 1. Susun isian; API key hanya ikut bila diisi.
    event.preventDefault();
    setSubmitting(true);
    const values = { label, model, priority: Number(priority), ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}) };
    // 2. Ubah (PATCH) bila ada penyedia awal; tambah (POST) penyedia baru dalam keadaan aktif.
    const result = await callAction(() =>
      initial
        ? updateAiProvider(initial.id, values)
        : createAiProvider({ ...values, provider: providerType, api_key: apiKey.trim(), is_active: true }),
    );
    setSubmitting(false);
    // 3. Gagal: galat per isian tampil di bawah isiannya; galat tanpa isian jadi toast.
    if ("error" in result) {
      setErrors(
        Object.fromEntries(Object.entries(result.error.fields ?? {}).map(([field, messages]) => [field, messages[0]])),
      );
      if (!result.error.fields) toast({ tone: "danger", message: result.error.message });
      return;
    }
    // 4. Berhasil: toast lalu beri tahu pemanggil (dialog ditutup dan data dimuat ulang).
    toast({ tone: "success", message: initial ? "Penyedia AI disimpan" : "Penyedia AI ditambahkan" });
    onDone();
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <fieldset disabled={!!initial} className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Penyedia</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AI_PROVIDER_TYPES.map((type) => (
            <label
              key={type}
              className={cx(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 has-[:disabled]:cursor-default",
                providerType === type ? "border-accent bg-primary-soft font-semibold" : "border-line bg-surface",
              )}
            >
              <input
                type="radio"
                name="penyedia"
                value={type}
                checked={providerType === type}
                onChange={() => selectProvider(type)}
                className={cx("size-4 accent-primary", focusRing)}
              />
              {AI_PROVIDER_INFO[type].name}
            </label>
          ))}
        </div>
        {initial && (
          <p className="text-xs text-ink-muted">
            Jenis penyedia tidak bisa diganti. Tambahkan penyedia baru bila perlu.
          </p>
        )}
      </fieldset>
      <a
        href={info.keyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          "inline-flex items-center gap-1 self-start text-sm font-medium text-primary underline",
          focusRing,
        )}
      >
        Buat API key gratis di {info.name}
        <ExternalLink aria-hidden className="size-3.5" />
      </a>
      <Field label="Nama" id="ai-label" required error={errors.label}>
        <Input value={label} maxLength={60} onChange={(event) => setLabel(event.target.value)} />
      </Field>
      <Field
        label="Model"
        id="ai-model"
        required
        help={`Contoh: ${info.exampleModels.join(", ")}. Nama model bisa berubah, cek halaman penyedia.`}
        error={errors.model}
      >
        <Input
          value={model}
          maxLength={120}
          list="ai-model-contoh"
          onChange={(event) => setModel(event.target.value)}
        />
      </Field>
      <datalist id="ai-model-contoh">
        {info.exampleModels.map((exampleModel) => (
          <option key={exampleModel} value={exampleModel} />
        ))}
      </datalist>
      <Field
        label="API key"
        id="ai-key"
        required={!initial}
        error={errors.api_key}
        help={
          initial
            ? `Tersimpan: ••••${initial.key_hint}. Kosongkan bila tidak diganti.`
            : "Disimpan terenkripsi dan tidak bisa dilihat lagi setelah disimpan."
        }
      >
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </Field>
      <Field
        label="Prioritas"
        id="ai-prioritas"
        required
        help="Angka kecil dicoba lebih dulu (1–1000)."
        error={errors.priority}
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        />
      </Field>
      <Button type="submit" loading={submitting} loadingText="Menyimpan…">
        {initial ? "Simpan perubahan" : "Tambah penyedia"}
      </Button>
    </form>
  );
}

/**
 * Label status penyedia. "Istirahat" berarti backend mengistirahatkan penyedia sementara setelah gagal, sampai jam
 * yang ditulis; selama itu penyedia berikutnya yang dicoba.
 * @param props.provider penyedia AI
 * @returns span berwarna
 */
function StatusChip({ provider }: { provider: AiProvider }) {
  const status = aiProviderStatus(provider);
  if (status.kind === "nonaktif")
    return <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-ink-muted">Nonaktif</span>;
  if (status.kind === "istirahat")
    return (
      <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning">
        Istirahat s.d. {formatTime(status.until)}
      </span>
    );
  return (
    <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success">Siap dipakai</span>
  );
}

/**
 * Panel penyedia AI: cara kerja, cadangan terakhir (GEMINI_API_KEY di server), dan daftar penyedia beserta aksinya.
 * @param props.data daftar penyedia (sudah urut prioritas) dan info cadangan dari backend
 * @returns panel penyedia beserta dialog tambah/ubah dan konfirmasi hapus
 */
export function AiProvidersPanel({ data }: { data: AiProviderList }) {
  // 1. State dialog formulir (null = tertutup), penyedia yang akan dihapus, dan hasil uji koneksi per id penyedia.
  const router = useRouter();
  const [form, setForm] = useState<{ initial: AiProvider | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<number, AiTestResult | "loading">>({});

  // 2. Sakelar aktif: simpan langsung, lalu muat ulang data halaman.
  async function toggleActive(provider: AiProvider, active: boolean) {
    const result = await callAction(() => updateAiProvider(provider.id, { is_active: active }));
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    router.refresh();
  }

  // 3. Uji koneksi: tandai "loading", simpan hasilnya (berhasil atau pesan galat), lalu muat ulang agar status
  //    terakhir berhasil/error ikut diperbarui.
  async function runTest(provider: AiProvider) {
    setTestResults((previous) => ({ ...previous, [provider.id]: "loading" }));
    const result = await callAction(() => testAiProvider(provider.id));
    setTestResults((previous) => ({
      ...previous,
      [provider.id]: "data" in result ? result.data : { ok: false, message: result.error.message },
    }));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles aria-hidden className="size-5 text-primary" />
          Cara kerja
        </h2>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-ink-muted">
          <li>Asisten AI mencoba penyedia aktif dari prioritas terkecil.</li>
          <li>
            Bila kena batas kuota (429), key ditolak, error, atau tidak menjawab, penyedia itu diistirahatkan sebentar
            dan penyedia berikutnya dicoba.
          </li>
          <li>
            Pakai key gratis milik sendiri dari tiap penyedia. API key disimpan terenkripsi dan tidak pernah ditampilkan
            lagi.
          </li>
        </ol>
        <p className="text-sm">
          Cadangan terakhir:{" "}
          {data.env_gemini ? (
            <span className="font-medium text-success">
              GEMINI_API_KEY di server aktif (model {data.env_gemini.model})
            </span>
          ) : (
            <span className="text-ink-muted">tidak ada (GEMINI_API_KEY di server kosong)</span>
          )}
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Urutan penyedia</h2>
        <Button onClick={() => setForm({ initial: null })}>
          <Plus aria-hidden className="size-4" />
          Tambah penyedia
        </Button>
      </div>

      {data.providers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
          Belum ada penyedia. Tambahkan minimal satu, misalnya Google Gemini dengan key gratis dari AI Studio.
        </p>
      ) : (
        <ol aria-label="Urutan penyedia" className="flex flex-col gap-3">
          {data.providers.map((provider, i) => {
            const testResult = testResults[provider.id];
            return (
              <li
                key={provider.id}
                className={cx(
                  "flex flex-col gap-3 rounded-lg border bg-surface p-4",
                  provider.is_active ? "border-line" : "border-dashed border-line opacity-70",
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    aria-label={`Urutan ${i + 1}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-steel font-mono font-bold text-on-steel"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                      {provider.label}
                      <StatusChip provider={provider} />
                    </p>
                    <p className="text-sm text-ink-muted">
                      {provider.provider_name} · prioritas {provider.priority}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-mono">{provider.model}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-ink-muted">
                        <KeyRound aria-hidden className="size-3.5" />
                        ••••{provider.key_hint}
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={provider.is_active}
                    onChange={(active) => void toggleActive(provider, active)}
                    label={`Aktifkan ${provider.label}`}
                  />
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  {provider.last_ok_at && (
                    <p className="text-ink-muted">Terakhir berhasil: {formatDateTime(provider.last_ok_at)}</p>
                  )}
                  {provider.last_error && provider.last_error_at && (
                    <p className="text-danger">
                      Error terakhir ({formatDateTime(provider.last_error_at)}): {provider.last_error}
                    </p>
                  )}
                  {testResult && testResult !== "loading" && (
                    <p
                      role="status"
                      className={cx(
                        "inline-flex items-center gap-1.5 font-medium",
                        testResult.ok ? "text-success" : "text-danger",
                      )}
                    >
                      {testResult.ok ? (
                        <CircleCheck aria-hidden className="size-4" />
                      ) : (
                        <CircleX aria-hidden className="size-4" />
                      )}
                      {testResult.ok ? `Tersambung (${testResult.ms} ms): “${testResult.sample}”` : testResult.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void runTest(provider)}
                    disabled={testResult === "loading"}
                  >
                    {testResult === "loading" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}Uji
                    koneksi
                  </Button>
                  <Button variant="secondary" onClick={() => setForm({ initial: provider })}>
                    <Pencil aria-hidden className="size-4" />
                    Ubah
                  </Button>
                  <Button variant="ghost" className="text-danger" onClick={() => setDeleteTarget(provider)}>
                    <Trash2 aria-hidden className="size-4" />
                    Hapus
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.initial ? `Ubah ${form.initial.label}` : "Tambah penyedia AI"}
      >
        {form && (
          <ProviderForm
            key={form.initial?.id ?? "new"}
            initial={form.initial}
            onDone={() => {
              setForm(null);
              router.refresh();
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Hapus ${deleteTarget?.label ?? ""}?`}
        body="API key penyedia ini ikut terhapus dan tidak bisa dikembalikan. Asisten AI memakai penyedia lain yang aktif."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={async () => {
          const provider = deleteTarget;
          setDeleteTarget(null);
          if (!provider) return;
          const result = await callAction(() => deleteAiProvider(provider.id));
          if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
          toast({ tone: "success", message: `${provider.label} dihapus` });
          router.refresh();
        }}
      />
    </div>
  );
}
