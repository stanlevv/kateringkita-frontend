// Komponen TicketReplyForm: formulir balasan admin di bawah percakapan /admin/tiket/<kode>. Balasan dikirim lewat
// server action replyToTicket (app/actions/admin/tickets.ts, POST /admin/tickets/<kode>/messages) dan sampai ke pembeli
// sebagai notifikasi. Server action = fungsi server yang bisa dipanggil langsung dari komponen di peramban.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { replyToTicket } from "@/app/actions/admin/tickets";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { MAX_REPLY_LENGTH } from "@/services/admin-ticket.service";

/**
 * Balas pembeli (1–2000 karakter). Galat validasi tampil di bawah isian (fields.body, atau pesan umumnya);
 * galat lain lewat toast. Tiket yang ternyata sudah ditutup (409) atau hilang (404) memuat ulang halaman agar tampil
 * keadaan terbarunya.
 * @param props.code kode tiket yang dibalas
 * @returns formulir balasan
 */
export function TicketReplyForm({ code }: { code: string }) {
  // 1. State isian balasan, pesan galat di bawah isian, dan tanda sedang mengirim.
  const router = useRouter();
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  // 2. Kirim balasan.
  async function submit(event: FormEvent) {
    // 1. Cegah kirim ganda dan balasan kosong, lalu panggil server action.
    event.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    const result = await callAction(() => replyToTicket(code, text));
    setBusy(false);
    // 2. Gagal: galat validasi di bawah isian; galat lain jadi toast, dan tiket tertutup/hilang memuat ulang halaman.
    if ("error" in result) {
      if (result.error.code === "VALIDATION_ERROR")
        return setErrorMessage(result.error.fields?.body?.[0] ?? result.error.message);
      toast({ tone: "danger", message: result.error.message });
      if (result.error.code === "TICKET_CLOSED" || result.error.code === "NOT_FOUND") router.refresh();
      return;
    }
    // 3. Berhasil: kosongkan isian, toast, lalu muat ulang data halaman agar balasan tampil di percakapan.
    setText("");
    setErrorMessage(undefined);
    toast({ tone: "success", message: "Balasan terkirim. Pembeli mendapat notifikasi." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 border-t border-line pt-4">
      <Field
        label="Balasan untuk pembeli"
        id={`balas-${code}`}
        required
        help={`${text.length}/${MAX_REPLY_LENGTH}`}
        error={errorMessage}
      >
        <Textarea
          value={text}
          maxLength={MAX_REPLY_LENGTH}
          rows={4}
          onChange={(event) => {
            setText(event.target.value);
            setErrorMessage(undefined);
          }}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!text.trim()} loading={busy} loadingText="Mengirim…">
          Kirim balasan
        </Button>
      </div>
    </form>
  );
}
