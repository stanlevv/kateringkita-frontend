"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { tanyaAsisten } from "@/app/actions/asisten";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { callAction } from "@/lib/action";
import type { AssistantAnswer } from "@/types/ai-result";

const CONTOH = [
  "Menu mana yang margin-nya paling tipis dan berapa harga yang lebih sehat?",
  "Buatkan paket snack box rapat 50 orang dari menu saya beserta harganya.",
  "Berapa kuota harian yang wajar untuk tiap menu berdasarkan penjualan 30 hari terakhir?",
];

const pesanGagal: Record<string, string> = {
  SERVICE_UNAVAILABLE: "Asisten AI belum diaktifkan di server.",
  RATE_LIMITED: "Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
};

// F17: tanya-jawab dengan konteks menu, HPP, dan penjualan toko sendiri
export function AsistenPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function kirim(ev?: FormEvent, isi = question) {
    ev?.preventDefault();
    const q = isi.trim();
    if (!q) return setGagal("Tulis pertanyaan dulu.");
    setQuestion(q);
    setGagal(null);
    start(async () => {
      const r = await callAction(() => tanyaAsisten(q));
      if ("data" in r) return setAnswer(r.data);
      // alasan per kolom dulu (mis. ditolak filter keamanan), lalu pesan umum
      setGagal(
        r.error.fields?.question?.[0] ?? pesanGagal[r.error.code] ?? r.error.message ?? "Terjadi kesalahan. Coba lagi.",
      );
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Sparkles aria-hidden className="size-5 text-primary" />
          Asisten AI toko
        </h2>
        <p className="text-sm text-ink-muted">
          Jawaban memakai data menu, HPP, dan penjualan 30 hari toko Anda. Periksa lagi sebelum dipakai.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Contoh pertanyaan">
        {CONTOH.map((c) => (
          <li key={c}>
            <Button
              type="button"
              variant="secondary"
              className="h-auto py-2 text-left text-sm"
              disabled={pending}
              onClick={() => kirim(undefined, c)}
            >
              {c}
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={kirim} noValidate className="flex flex-col gap-3">
        <Field label="Pertanyaan" id="pertanyaan-asisten">
          <Textarea rows={3} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)} />
        </Field>
        <Button type="submit" loading={pending} loadingText="Menyusun jawaban…" className="self-start">
          Tanya asisten
        </Button>
      </form>
      {gagal && <Banner tone="danger">{gagal}</Banner>}
      {answer && !pending && (
        <div aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-line bg-subtle p-4 text-ink">
          <p className="whitespace-pre-wrap">{answer.answer}</p>
          {answer.points?.length ? (
            <ul aria-label="Poin penting" className="list-disc space-y-1 pl-5">
              {answer.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : null}
          {answer.assumption && <p className="text-sm text-ink-muted">Asumsi: {answer.assumption}</p>}
        </div>
      )}
    </Card>
  );
}
