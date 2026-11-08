"use client";

import { useRouter } from "next/navigation";
import { CircleAlert, CloudOff } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Checkbox } from "@/app/components/ui/Checkbox";
import type { PickupPoint } from "@/types/meta";

/** PG-E4: `points` null = daftar gagal dimuat; hanya bagian ini yang menampilkan galat. */
export function PickupPointPicker({ points, value, onChange, error, onBlur }: { points: PickupPoint[] | null; value: number[]; onChange: (ids: number[]) => void; error?: string; onBlur?: () => void }) {
  const router = useRouter();
  if (points === null) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger bg-danger-bg p-3 text-danger">
        <CloudOff aria-hidden className="size-5 shrink-0" />
        <p className="flex-1">Daftar titik temu belum bisa dimuat. Coba lagi.</p>
        <Button variant="secondary" onClick={() => router.refresh()}>Coba lagi</Button>
      </div>
    );
  }
  const ubah = (id: number, on: boolean) => onChange(on ? [...value, id] : value.filter((x) => x !== id));
  return (
    <div id="pg-pickup_point_ids" tabIndex={-1} onBlur={onBlur} className="flex flex-col focus-visible:ring-2 focus-visible:ring-focus">
      {points.length === 0 && <p className="text-ink-muted">Belum ada titik temu yang tersedia.</p>}
      {points.map((p) => (
        <Checkbox key={p.id} label={p.name} checked={value.includes(p.id)} onChange={(e) => ubah(p.id, e.target.checked)} />
      ))}
      {error && (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
