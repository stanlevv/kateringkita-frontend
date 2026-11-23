"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveServiceFee } from "@/app/actions/admin/promos";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { validateServiceFee } from "@/services/admin-master.service";
import { formatRupiah } from "@/lib/format";

/** A-04 — biaya layanan per pesanan. */
export function ServiceFeeForm({ currentFee }: { currentFee: number }) {
  const router = useRouter();
  const [text, setText] = useState(String(currentFee));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const fee = text.trim() === "" ? NaN : Number(text);
    const problem = validateServiceFee(fee);
    if (problem) return setError(problem);
    setError(undefined);
    if (fee === currentFee) return void toast({ tone: "info", message: "Tidak ada perubahan" });
    setSaving(true);
    const result = await callAction(() => saveServiceFee(fee));
    setSaving(false);
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: "Biaya layanan disimpan" });
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Biaya layanan"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <h2 className="text-lg font-semibold text-ink">Biaya layanan</h2>
      <p className="text-ink-muted">
        Saat ini <span className="font-mono font-semibold text-ink">{formatRupiah(currentFee)}</span> per pesanan.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <Field label="Biaya baru (Rp)" id="biaya" help="Bilangan bulat 0–100.000." error={error}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={text}
              onChange={(event) => {
                setError(undefined);
                setText(event.target.value);
              }}
            />
          </Field>
        </div>
        <Button type="submit" loading={saving} loadingText="Menyimpan…">
          Simpan
        </Button>
      </div>
    </form>
  );
}
