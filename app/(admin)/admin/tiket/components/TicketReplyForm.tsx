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
 * galat lain lewat toast. Tiket yang ternyata sudah ditutup (409) memuat ulang halaman agar tampil keadaan terbarunya.
 */
export function TicketReplyForm({ code }: { code: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    const result = await callAction(() => replyToTicket(code, text));
    setBusy(false);
    if ("error" in result) {
      if (result.error.code === "VALIDATION_ERROR")
        return setErrorMessage(result.error.fields?.body?.[0] ?? result.error.message);
      toast({ tone: "danger", message: result.error.message });
      if (result.error.code === "TICKET_CLOSED" || result.error.code === "NOT_FOUND") router.refresh();
      return;
    }
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
