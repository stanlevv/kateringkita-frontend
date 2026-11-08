"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cx, fokus } from "./cx";

const tombol = cx("inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50", fokus);

export function Stepper({ value, min, max, onChange, onDelta, disabledReason, label }: { value: number; min: number; max?: number; onChange: (n: number) => void; onDelta?: (delta: number) => void; disabledReason?: string; label: string }) {
  const alasanId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const terbaru = useRef({ value, onChange, onDelta });
  useEffect(() => { terbaru.current = { value, onChange, onDelta }; });
  const timer = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
  const viaPointer = useRef(false);

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  const langkah = (d: 1 | -1) => {
    const { value: v, onChange: oc, onDelta: od } = terbaru.current;
    const n = v + d;
    if (n < min || (max !== undefined && n > max)) return;
    setDraft(null);
    terbaru.current.value = n; // agar ketukan beruntun tidak membaca nilai lama sebelum render ulang
    if (od) od(d);
    else oc(n);
  };
  const berhenti = () => { clearTimeout(timer.current.t); clearInterval(timer.current.i); };
  useEffect(() => berhenti, []);
  // Dibatalkan: tidak akan ada klik, jadi aktivasi papan ketik berikutnya tidak boleh tertelan.
  const batal = () => { berhenti(); viaPointer.current = false; };
  // Keluar: pada sentuhan, pointerleave datang SEBELUM klik sintetis (buttons 0) -> jangan reset;
  // hanya saat masih ditekan (seret keluar) klik tidak akan menyusul.
  const keluar = (e: { buttons: number }) => { if (e.buttons !== 0) batal(); else berhenti(); };
  const tahan = (d: 1 | -1) => {
    viaPointer.current = true;
    langkah(d);
    berhenti();
    timer.current.t = setTimeout(() => { timer.current.i = setInterval(() => langkah(d), 80); }, 400);
  };
  const klik = (d: 1 | -1) => {
    if (viaPointer.current) { viaPointer.current = false; return; }
    langkah(d); // lewat papan ketik
  };

  const simpan = () => {
    if (draft === null) return;
    const n = Number(draft);
    // shortcut: nilai tak valid dikembalikan diam-diam; tambah pesan galat bila UX meminta.
    if (/^\d+$/.test(draft.trim()) && n >= min && (max === undefined || n <= max) && n !== value) onChange(n);
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <button type="button" aria-label={`Kurangi ${label}`} disabled={atMin} aria-describedby={atMin && disabledReason ? alasanId : undefined}
          onPointerDown={(e) => e.button === 0 && !atMin && tahan(-1)} onPointerUp={berhenti} onPointerLeave={keluar} onPointerCancel={batal} onClick={() => klik(-1)} className={tombol}>
          <Minus aria-hidden className="size-4" />
        </button>
        <input type="number" inputMode="numeric" aria-label={label} value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)} onBlur={simpan} onKeyDown={(e) => e.key === "Enter" && simpan()}
          className={cx("min-h-11 w-20 rounded-md border border-line-strong bg-surface text-center font-mono text-ink", fokus)} />
        <button type="button" aria-label={`Tambah ${label}`} disabled={atMax}
          onPointerDown={(e) => e.button === 0 && !atMax && tahan(1)} onPointerUp={berhenti} onPointerLeave={keluar} onPointerCancel={batal} onClick={() => klik(1)} className={tombol}>
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {atMin && disabledReason && <p id={alasanId} className="text-sm text-ink-muted">{disabledReason}</p>}
    </div>
  );
}
