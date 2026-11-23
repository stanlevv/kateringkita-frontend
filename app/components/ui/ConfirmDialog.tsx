"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { Textarea } from "./Input";

const OTHER_REASON = "Lainnya";

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

function ConfirmDialogBody({
  onClose,
  body,
  confirmLabel,
  cancelLabel = "Batal",
  tone,
  reasons,
  requireReason,
  busy,
  onConfirm,
}: Omit<Props, "open" | "title">) {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const isOther = selected === OTHER_REASON;
  const reason = isOther ? otherText.trim() : (selected ?? undefined);
  const missingReason = !!requireReason && !reason;

  return (
    <>
      <div className="text-ink-muted">{body}</div>
      {reasons && (
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-sm font-medium">Alasan</legend>
          {[...reasons, OTHER_REASON].map((reasonOption) => (
            <label key={reasonOption} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="alasan"
                value={reasonOption}
                checked={selected === reasonOption}
                onChange={() => setSelected(reasonOption)}
                className="size-5 accent-primary"
              />
              {reasonOption}
            </label>
          ))}
        </fieldset>
      )}
      {isOther && (
        <Field label="Tulis alasan" required>
          <Textarea autoFocus value={otherText} onChange={(event) => setOtherText(event.target.value)} />
        </Field>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={tone} disabled={missingReason || busy} onClick={() => onConfirm(reason)} className="sm:ml-4">
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

export function ConfirmDialog({ open, onClose, title, ...rest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ConfirmDialogBody onClose={onClose} {...rest} />
    </Dialog>
  );
}
