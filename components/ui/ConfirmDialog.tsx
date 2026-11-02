"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { Textarea } from "./Input";

const LAINNYA = "Lainnya";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone: "danger" | "primary";
  reasons?: string[];
  requireReason?: boolean;
  busy?: boolean;
  onConfirm: (reason?: string) => void;
};

function Isi({ onClose, body, confirmLabel, cancelLabel = "Batal", tone, reasons, requireReason, busy, onConfirm }: Omit<Props, "open" | "title">) {
  const [pilih, setPilih] = useState<string | null>(null);
  const [teks, setTeks] = useState("");
  const lainnya = pilih === LAINNYA;
  const alasan = lainnya ? teks.trim() : (pilih ?? undefined);
  const kurang = !!requireReason && !alasan;

  return (
    <>
      <div className="text-ink-muted">{body}</div>
      {reasons && (
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-sm font-medium">Alasan</legend>
          {[...reasons, LAINNYA].map((r) => (
            <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="radio" name="alasan" value={r} checked={pilih === r} onChange={() => setPilih(r)} className="size-5 accent-primary" />
              {r}
            </label>
          ))}
        </fieldset>
      )}
      {lainnya && (
        <Field label="Tulis alasan" required>
          <Textarea autoFocus value={teks} onChange={(e) => setTeks(e.target.value)} />
        </Field>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={tone} disabled={kurang || busy} onClick={() => onConfirm(alasan)} className="sm:ml-4">{confirmLabel}</Button>
      </div>
    </>
  );
}

export function ConfirmDialog({ open, onClose, title, ...rest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <Isi onClose={onClose} {...rest} />
    </Dialog>
  );
}
