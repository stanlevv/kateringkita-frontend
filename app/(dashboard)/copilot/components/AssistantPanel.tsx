// Komponen AssistantPanel: asisten AI toko (copilot) di /copilot. Penjual mengetik pertanyaan atau memilih contoh;
// pertanyaan dikirim lewat server action askAssistant (app/actions/assistant.ts, POST /merchant/assistant). Backend
// menjawab dengan konteks menu, HPP, dan penjualan 30 hari toko itu sendiri.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { askAssistant } from "@/app/actions/assistant";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { callAction } from "@/lib/action";
import type { AssistantAnswer } from "@/types/ai-result";

/** Contoh pertanyaan yang bisa langsung dikirim dengan satu klik. */
const EXAMPLE_QUESTIONS = [
  "Menu mana yang margin-nya paling tipis dan berapa harga yang lebih sehat?",
  "Buatkan paket snack box rapat 50 orang dari menu saya beserta harganya.",
  "Berapa kuota harian yang wajar untuk tiap menu berdasarkan penjualan 30 hari terakhir?",
];

/** Pesan untuk kode galat yang umum (kunci = kode galat dari backend). */
const ERROR_MESSAGES: Record<string, string> = {
  SERVICE_UNAVAILABLE: "Asisten AI belum diaktifkan di server.",
  RATE_LIMITED: "Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.",
  NETWORK: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
};

/**
 * Panel tanya-jawab asisten AI. Jawaban tampil di bawah formulir bersama poin penting dan asumsinya.
 * useTransition dipakai agar tombol menampilkan status menunggu selama jawaban disusun.
 * @returns Card berisi contoh pertanyaan, formulir, dan jawaban
 */
export function AssistantPanel() {
  // 1. Isi pertanyaan, jawaban terakhir, pesan galat, dan status menunggu.
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 2. Pengirim pertanyaan (dipakai formulir dan tombol contoh).
  /**
   * Mengirim pertanyaan dari formulir atau dari tombol contoh.
   * @param event event submit formulir (kosong bila dari tombol contoh)
   * @param questionText teks pertanyaan; bawaan isi kotak pertanyaan
   */
  function submit(event?: FormEvent, questionText = question) {
    // 1. Tolak pertanyaan kosong.
    event?.preventDefault();
    const trimmed = questionText.trim();
    if (!trimmed) return setErrorMessage("Tulis pertanyaan dulu.");
    // 2. Kirim; tampilkan jawaban atau pesan galat.
    setQuestion(trimmed);
    setErrorMessage(null);
    startTransition(async () => {
      const result = await callAction(() => askAssistant(trimmed));
      if ("data" in result) return setAnswer(result.data);
      // alasan per kolom dulu (mis. ditolak filter keamanan), lalu pesan umum
      setErrorMessage(
        result.error.fields?.question?.[0] ??
          ERROR_MESSAGES[result.error.code] ??
          result.error.message ??
          "Terjadi kesalahan. Coba lagi.",
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
        {EXAMPLE_QUESTIONS.map((example) => (
          <li key={example}>
            <Button
              type="button"
              variant="secondary"
              className="h-auto py-2 text-left text-sm"
              disabled={pending}
              onClick={() => submit(undefined, example)}
            >
              {example}
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Pertanyaan" id="pertanyaan-asisten">
          <Textarea rows={3} maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} />
        </Field>
        <Button type="submit" loading={pending} loadingText="Menyusun jawaban…" className="self-start">
          Tanya asisten
        </Button>
      </form>
      {errorMessage && <Banner tone="danger">{errorMessage}</Banner>}
      {answer && !pending && (
        <div aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-line bg-subtle p-4 text-ink">
          <p className="whitespace-pre-wrap">{answer.answer}</p>
          {answer.points?.length ? (
            <ul aria-label="Poin penting" className="list-disc space-y-1 pl-5">
              {answer.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : null}
          {answer.assumption && <p className="text-sm text-ink-muted">Asumsi: {answer.assumption}</p>}
        </div>
      )}
    </Card>
  );
}
