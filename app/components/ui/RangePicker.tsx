"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { validateRange, daysBefore } from "@/lib/report";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Input } from "@/app/components/ui/Input";

/** LP-N1, LP-E1. Rentang tinggal di URL (`dari`, `sampai`); isian tidak sah ditolak di sini dan tidak mengubah URL. */
export function RangePicker({
  from,
  to,
  today,
  error,
}: {
  from: string;
  to: string;
  today: string;
  error: string | null;
}) {
  const router = useRouter();
  const path = usePathname();
  const presets = [
    { label: "Hari ini", from: today },
    { label: "7 hari", from: daysBefore(today, 6) },
    { label: "30 hari", from: daysBefore(today, 29) },
  ];
  const activePreset = presets.find((option) => option.from === from && to === today)?.label;
  const [showCustom, setShowCustom] = useState(!activePreset || !!error);
  const [draftRange, setDraftRange] = useState({ from, to });
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  const navigate = (rangeFrom: string, rangeTo: string) =>
    router.replace(`${path}?dari=${rangeFrom}&sampai=${rangeTo}`, { scroll: false });

  function updateField(field: "from" | "to", value: string) {
    const nextRange = { ...draftRange, [field]: value };
    setDraftRange(nextRange);
    const rangeError = validateRange(nextRange.from, nextRange.to, today);
    setLocalError(rangeError);
    if (!rangeError) navigate(nextRange.from, nextRange.to);
  }

  function choosePreset(option: (typeof presets)[number]) {
    setShowCustom(false);
    setLocalError(null);
    setDraftRange({ from: option.from, to: today });
    navigate(option.from, today);
  }

  const buttonClass = (pressed: boolean) =>
    cx(
      "inline-flex min-h-11 items-center rounded-md border px-4 font-medium",
      focusRing,
      pressed
        ? "border-primary bg-primary-soft text-primary"
        : "border-line-strong bg-surface text-ink hover:bg-subtle",
    );

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Rentang laporan" className="flex flex-wrap gap-2">
        {presets.map((option) => {
          const pressed = !showCustom && activePreset === option.label;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => choosePreset(option)}
              className={buttonClass(pressed)}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={showCustom}
          onClick={() => setShowCustom(true)}
          className={buttonClass(showCustom)}
        >
          Pilih tanggal
        </button>
      </div>
      {showCustom && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Dari tanggal
            <Input
              type="date"
              value={draftRange.from}
              max={today}
              aria-invalid={!!shownError}
              aria-describedby={shownError ? "galat-rentang" : undefined}
              onChange={(event) => updateField("from", event.target.value)}
              className="sm:w-44"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Sampai tanggal
            <Input
              type="date"
              value={draftRange.to}
              max={today}
              aria-invalid={!!shownError}
              aria-describedby={shownError ? "galat-rentang" : undefined}
              onChange={(event) => updateField("to", event.target.value)}
              className="sm:w-44"
            />
          </label>
        </div>
      )}
      {shownError && (
        <p id="galat-rentang" role="alert" className="text-sm font-medium text-danger">
          {shownError}
        </p>
      )}
    </div>
  );
}
