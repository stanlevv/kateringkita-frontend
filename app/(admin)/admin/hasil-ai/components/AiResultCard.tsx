"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Sparkles, XCircle, type LucideIcon } from "lucide-react";
import { verifyAiResult } from "@/app/actions/admin/ai-results";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatTime, formatRupiah, formatDate } from "@/lib/format";
import type { Tone } from "@/lib/order-status";
import type { AiResult, AssistantOutput, RecommendationOutput, AiResultStatus } from "@/types/ai-result";

export const STATUS_LABELS: Record<AiResultStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  menunggu: { label: "Menunggu", tone: "warning", icon: Clock },
  disetujui: { label: "Disetujui", tone: "success", icon: CheckCircle2 },
  ditolak: { label: "Ditolak", tone: "danger", icon: XCircle },
};
const FEATURE_LABELS = { asisten: "Asisten toko", rekomendasi: "Rekomendasi pembeli" } as const;
const REASON_HINT = "Tulis alasan penolakan (3–300 karakter).";
const formatDateTime = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)} WIB`;

function AssistantOutputView({ output }: { output: AssistantOutput }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="whitespace-pre-wrap">{output.jawaban}</p>
      {output.poin.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {output.poin.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      )}
      {output.asumsi && <p className="text-sm text-ink-muted">Asumsi: {output.asumsi}</p>}
    </div>
  );
}

function RecommendationOutputView({ output }: { output: RecommendationOutput }) {
  return (
    <div className="flex flex-col gap-2">
      <p>{output.summary}</p>
      {output.items.length > 0 ? (
        <ul className="space-y-1">
          {output.items.map((item) => (
            <li key={item.menu_id}>
              {item.qty}× {item.menu} · {item.toko} · {formatRupiah(item.subtotal)}
              {item.reason && <span className="text-ink-muted"> — {item.reason}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">AI tidak memilih menu.</p>
      )}
      <p className="font-semibold">Total {formatRupiah(output.total)}</p>
    </div>
  );
}

/** Satu hasil AI tersimpan: konteks, masukan (sudah disamarkan), keluaran tervalidasi, status, dan aksi verifikasi. */
export function AiResultCard({ aiResult, canEdit }: { aiResult: AiResult; canEdit: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [busy, setBusy] = useState<"disetujui" | "ditolak" | null>(null);
  const statusView = STATUS_LABELS[aiResult.status];

  async function decide(status: "disetujui" | "ditolak") {
    if (busy) return;
    const trimmedNote = note.trim();
    if (status === "ditolak" && (trimmedNote.length < 3 || trimmedNote.length > 300))
      return setErrorMessage(REASON_HINT);
    setBusy(status);
    const result = await callAction(() => verifyAiResult(aiResult.id, status, trimmedNote));
    setBusy(null);
    if ("error" in result) {
      if (result.error.code === "VALIDATION_ERROR" && result.error.fields?.catatan)
        return setErrorMessage(result.error.fields.catatan[0]);
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    setErrorMessage(undefined);
    setNote("");
    toast({ tone: "success", message: status === "disetujui" ? "Hasil AI disetujui." : "Hasil AI ditolak." });
    router.refresh();
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info" icon={Sparkles}>
            {FEATURE_LABELS[aiResult.fitur]}
          </Badge>
          <span className="text-sm text-ink-muted">
            {[aiResult.user?.name, aiResult.merchant?.business_name].filter(Boolean).join(" · ") || "Pengguna dihapus"}{" "}
            · {formatDateTime(aiResult.created_at)}
          </span>
        </div>
        <Badge tone={statusView.tone} icon={statusView.icon}>
          {statusView.label}
        </Badge>
      </header>
      <div>
        <p className="text-sm font-semibold text-ink-muted">Masukan (data pribadi disamarkan)</p>
        <p className="whitespace-pre-wrap break-words">{aiResult.input_text}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-muted">Keluaran AI (lolos validasi skema)</p>
        {aiResult.fitur === "asisten" ? (
          <AssistantOutputView output={aiResult.output as AssistantOutput} />
        ) : (
          <RecommendationOutputView output={aiResult.output as RecommendationOutput} />
        )}
      </div>
      {aiResult.verified_by && aiResult.verified_at && (
        <p className="text-sm text-ink-muted">
          {statusView.label} oleh {aiResult.verified_by.name} · {formatDateTime(aiResult.verified_at)}
          {aiResult.catatan && <> — “{aiResult.catatan}”</>}
        </p>
      )}
      {canEdit ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <Field label="Catatan verifikasi (wajib bila ditolak)" id={`catatan-ai-${aiResult.id}`} error={errorMessage}>
            <Textarea
              rows={2}
              maxLength={300}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setErrorMessage(undefined);
              }}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              loading={busy === "ditolak"}
              disabled={busy !== null}
              onClick={() => decide("ditolak")}
            >
              Tolak
            </Button>
            <Button loading={busy === "disetujui"} disabled={busy !== null} onClick={() => decide("disetujui")}>
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
