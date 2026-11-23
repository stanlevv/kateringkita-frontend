"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cx, focusRing } from "./cx";

const buttonClass = cx(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
);

export function Stepper({
  value,
  min,
  max,
  onChange,
  onDelta,
  disabledReason,
  label,
}: {
  value: number;
  min: number;
  max?: number;
  onChange: (nextValue: number) => void;
  onDelta?: (delta: number) => void;
  disabledReason?: string;
  label: string;
}) {
  const reasonId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const latest = useRef({ value, onChange, onDelta });
  useEffect(() => {
    latest.current = { value, onChange, onDelta };
  });
  const timer = useRef<{ holdDelay?: ReturnType<typeof setTimeout>; repeatInterval?: ReturnType<typeof setInterval> }>(
    {},
  );
  const viaPointer = useRef(false);

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  const step = (direction: 1 | -1) => {
    const { value: currentValue, onChange: notifyChange, onDelta: notifyDelta } = latest.current;
    const nextValue = currentValue + direction;
    if (nextValue < min || (max !== undefined && nextValue > max)) return;
    setDraft(null);
    latest.current.value = nextValue; // agar ketukan beruntun tidak membaca nilai lama sebelum render ulang
    if (notifyDelta) notifyDelta(direction);
    else notifyChange(nextValue);
  };
  const stopRepeat = () => {
    clearTimeout(timer.current.holdDelay);
    clearInterval(timer.current.repeatInterval);
  };
  useEffect(() => stopRepeat, []);
  // Dibatalkan: tidak akan ada klik, jadi aktivasi papan ketik berikutnya tidak boleh tertelan.
  const cancelPress = () => {
    stopRepeat();
    viaPointer.current = false;
  };
  // Keluar: pada sentuhan, pointerleave datang SEBELUM klik sintetis (buttons 0) -> jangan reset;
  // hanya saat masih ditekan (seret keluar) klik tidak akan menyusul.
  const leavePointer = (event: { buttons: number }) => {
    if (event.buttons !== 0) cancelPress();
    else stopRepeat();
  };
  const startHold = (direction: 1 | -1) => {
    viaPointer.current = true;
    step(direction);
    stopRepeat();
    timer.current.holdDelay = setTimeout(() => {
      timer.current.repeatInterval = setInterval(() => step(direction), 80);
    }, 400);
  };
  const clickStep = (direction: 1 | -1) => {
    if (viaPointer.current) {
      viaPointer.current = false;
      return;
    }
    step(direction); // lewat papan ketik
  };

  const commitDraft = () => {
    if (draft === null) return;
    const nextValue = Number(draft);
    // shortcut: nilai tak valid dikembalikan diam-diam; tambah pesan galat bila UX meminta.
    if (
      /^\d+$/.test(draft.trim()) &&
      nextValue >= min &&
      (max === undefined || nextValue <= max) &&
      nextValue !== value
    )
      onChange(nextValue);
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          aria-label={`Kurangi ${label}`}
          disabled={atMin}
          aria-describedby={atMin && disabledReason ? reasonId : undefined}
          onPointerDown={(event) => event.button === 0 && !atMin && startHold(-1)}
          onPointerUp={stopRepeat}
          onPointerLeave={leavePointer}
          onPointerCancel={cancelPress}
          onClick={() => clickStep(-1)}
          className={buttonClass}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={draft ?? String(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => event.key === "Enter" && commitDraft()}
          className={cx(
            "min-h-11 w-20 rounded-md border border-line-strong bg-surface text-center font-mono text-ink",
            focusRing,
          )}
        />
        <button
          type="button"
          aria-label={`Tambah ${label}`}
          disabled={atMax}
          onPointerDown={(event) => event.button === 0 && !atMax && startHold(1)}
          onPointerUp={stopRepeat}
          onPointerLeave={leavePointer}
          onPointerCancel={cancelPress}
          onClick={() => clickStep(1)}
          className={buttonClass}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {atMin && disabledReason && (
        <p id={reasonId} className="text-sm text-ink-muted">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
