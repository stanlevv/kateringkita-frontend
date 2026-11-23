"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Sparkles, XCircle, type LucideIcon } from "lucide-react";
import { verifikasiHasilAi } from "@/app/actions/admin/hasilAi";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatTime, formatRupiah, formatDate } from "@/lib/format";
import type { Tone } from "@/lib/order-status";
import type { AiResult, AssistantOutput, RecommendationOutput, AiResultStatus } from "@/types/ai-result";

export const LABEL_STATUS: Record<AiResultStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  menunggu: { label: "Menunggu", tone: "warning", icon: Clock },
  disetujui: { label: "Disetujui", tone: "success", icon: CheckCircle2 },
  ditolak: { label: "Ditolak", tone: "danger", icon: XCircle },
};
const LABEL_FITUR = { asisten: "Asisten toko", rekomendasi: "Rekomendasi pembeli" } as const;
const ALASAN = "Tulis alasan penolakan (3–300 karakter).";
const waktu = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)} WIB`;

function IsiAsisten({ o }: { o: AssistantOutput }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="whitespace-pre-wrap">{o.jawaban}</p>
      {o.poin.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {o.poin.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {o.asumsi && <p className="text-sm text-ink-muted">Asumsi: {o.asumsi}</p>}
    </div>
  );
}

function IsiRekomendasi({ o }: { o: RecommendationOutput }) {
  return (
    <div className="flex flex-col gap-2">
      <p>{o.summary}</p>
      {o.items.length > 0 ? (
        <ul className="space-y-1">
          {o.items.map((i) => (
            <li key={i.menu_id}>
              {i.qty}× {i.menu} · {i.toko} · {formatRupiah(i.subtotal)}
              {i.reason && <span className="text-ink-muted"> — {i.reason}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">AI tidak memilih menu.</p>
      )}
      <p className="font-semibold">Total {formatRupiah(o.total)}</p>
    </div>
  );
}

/** Satu hasil AI tersimpan: konteks, masukan (sudah disamarkan), keluaran tervalidasi, status, dan aksi verifikasi. */
export function KartuHasilAi({ h, bolehUbah }: { h: AiResult; bolehUbah: boolean }) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sibuk, setSibuk] = useState<"disetujui" | "ditolak" | null>(null);
  const st = LABEL_STATUS[h.status];

  async function putuskan(status: "disetujui" | "ditolak") {
    if (sibuk) return;
    const isi = catatan.trim();
    if (status === "ditolak" && (isi.length < 3 || isi.length > 300)) return setGalat(ALASAN);
    setSibuk(status);
    const r = await callAction(() => verifikasiHasilAi(h.id, status, isi));
    setSibuk(null);
    if ("error" in r) {
      if (r.error.code === "VALIDATION_ERROR" && r.error.fields?.catatan) return setGalat(r.error.fields.catatan[0]);
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    setGalat(undefined);
    setCatatan("");
    toast({ tone: "success", message: status === "disetujui" ? "Hasil AI disetujui." : "Hasil AI ditolak." });
    router.refresh();
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info" icon={Sparkles}>
            {LABEL_FITUR[h.fitur]}
          </Badge>
          <span className="text-sm text-ink-muted">
            {[h.user?.name, h.merchant?.business_name].filter(Boolean).join(" · ") || "Pengguna dihapus"} ·{" "}
            {waktu(h.created_at)}
          </span>
        </div>
        <Badge tone={st.tone} icon={st.icon}>
          {st.label}
        </Badge>
      </header>
      <div>
        <p className="text-sm font-semibold text-ink-muted">Masukan (data pribadi disamarkan)</p>
        <p className="whitespace-pre-wrap break-words">{h.input_text}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-muted">Keluaran AI (lolos validasi skema)</p>
        {h.fitur === "asisten" ? (
          <IsiAsisten o={h.output as AssistantOutput} />
        ) : (
          <IsiRekomendasi o={h.output as RecommendationOutput} />
        )}
      </div>
      {h.verified_by && h.verified_at && (
        <p className="text-sm text-ink-muted">
          {st.label} oleh {h.verified_by.name} · {waktu(h.verified_at)}
          {h.catatan && <> — “{h.catatan}”</>}
        </p>
      )}
      {bolehUbah ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <Field label="Catatan verifikasi (wajib bila ditolak)" id={`catatan-ai-${h.id}`} error={galat}>
            <Textarea
              rows={2}
              maxLength={300}
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setGalat(undefined);
              }}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              loading={sibuk === "ditolak"}
              disabled={sibuk !== null}
              onClick={() => putuskan("ditolak")}
            >
              Tolak
            </Button>
            <Button loading={sibuk === "disetujui"} disabled={sibuk !== null} onClick={() => putuskan("disetujui")}>
              Setujui
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Hanya admin Super atau Operasional yang bisa memverifikasi.</p>
      )}
    </article>
  );
}
