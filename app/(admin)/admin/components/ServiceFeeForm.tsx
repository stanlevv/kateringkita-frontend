// Komponen ServiceFeeForm: formulir biaya layanan per pesanan di /admin/promo. Disimpan lewat server action
// saveServiceFee (app/actions/admin/promos.ts); aturan angka dari validateServiceFee (services/admin-master.service.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
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

/**
 * Formulir biaya layanan per pesanan (bilangan bulat 0–100.000 Rupiah).
 * @param props.currentFee biaya yang berlaku sekarang
 * @returns formulir dengan biaya sekarang, isian biaya baru, dan tombol Simpan
 */
export function ServiceFeeForm({ currentFee }: { currentFee: number }) {
  const router = useRouter();
  const [text, setText] = useState(String(currentFee));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Simpan biaya baru.
  async function submit(event: React.FormEvent) {
    // 1. Ubah teks menjadi angka (kosong = NaN supaya ditolak) dan periksa aturannya.
    event.preventDefault();
    const fee = text.trim() === "" ? NaN : Number(text);
    const problem = validateServiceFee(fee);
    if (problem) return setError(problem);
    setError(undefined);
    // 2. Tidak berubah: cukup beri tahu. Berubah: kirim ke server lalu muat ulang data halaman.
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
