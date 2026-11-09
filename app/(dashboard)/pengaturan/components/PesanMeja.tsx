"use client";

import { useState, type FormEvent } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import { panggil } from "@/lib/aksi";
import { setDineIn, tambahMeja, ubahMeja } from "@/app/actions/meja";
import { gambarQr, QrMeja } from "@/app/components/meja/QrMeja";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, fokus } from "@/app/components/ui/cx";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import type { Meja } from "@/types/meja";

async function unduh(m: Meja) {
  const a = document.createElement("a");
  a.href = await gambarQr(m.token, 1024);
  a.download = `qr-meja-${m.label}.png`;
  a.click();
}

export function PesanMeja({ aktifAwal, mejaAwal }: { aktifAwal: boolean; mejaAwal: Meja[] | null }) {
  const [aktif, setAktif] = useState(aktifAwal);
  const [meja, setMeja] = useState<Meja[]>(mejaAwal ?? []);
  const [label, setLabel] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sibuk, setSibuk] = useState(false);
  const [ganti, setGanti] = useState<Meja | null>(null);

  async function sakelar(v: boolean) {
    setAktif(v);
    const r = await panggil(() => setDineIn(v));
    if ("error" in r) {
      setAktif(!v);
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    toast({ tone: "success", message: v ? "Pesan dari meja aktif" : "Pesan dari meja dimatikan" });
  }

  async function tambah(e: FormEvent) {
    e.preventDefault();
    setSibuk(true);
    const r = await panggil(() => tambahMeja(label));
    setSibuk(false);
    if ("error" in r) {
      setGalat(r.error.fields?.label?.[0] ?? r.error.message);
      return;
    }
    setMeja((daftar) => [...daftar, r.data]);
    setLabel("");
    setGalat(undefined);
  }

  async function ubah(m: Meja, input: { is_active?: boolean; ganti_token?: true }) {
    const r = await panggil(() => ubahMeja(m.id, input));
    if ("error" in r) {
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    setMeja((daftar) => daftar.map((x) => (x.id === m.id ? r.data : x)));
    if (input.ganti_token) toast({ tone: "success", message: `QR Meja ${m.label} diganti. Cetak ulang QR-nya.` });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">Terima pesanan dari meja</p>
          <p className="text-sm text-ink-muted">
            Pelanggan scan QR di meja, memilih menu, lalu bayar online (QRIS, e-wallet, atau VA) tanpa membuat akun.
            Pesanan masuk ke antrean dengan label meja dan otomatis diterima setelah lunas.
          </p>
        </div>
        <Switch checked={aktif} onChange={sakelar} label="Terima pesanan dari meja" />
      </div>
      {!aktif && <p className="rounded-md bg-subtle px-3 py-2 text-sm text-ink-muted">Selama sakelar mati, semua QR meja menampilkan pesan tidak aktif.</p>}

      {mejaAwal === null ? (
        <p className="text-sm text-danger">Daftar meja gagal dimuat. Muat ulang halaman.</p>
      ) : (
        <>
          <form onSubmit={tambah} noValidate className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Field label="Nama meja" id="meja-label" help="Contoh: 1, 2, Teras A. Tiap meja mendapat QR sendiri." error={galat}>
                <Input value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" loading={sibuk} loadingText="Menambah…" disabled={!label.trim()}>Tambah meja</Button>
            {meja.length > 0 && (
              <a href="/cetak-qr" target="_blank" rel="noopener"
                className={cx("inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle", fokus)}>
                <Printer aria-hidden className="size-4" />Cetak semua QR
              </a>
            )}
          </form>

          {meja.length === 0 ? (
            <p className="text-sm text-ink-muted">Belum ada meja. Tambahkan meja pertama untuk mendapatkan QR-nya.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {meja.map((m) => (
                <li key={m.id} className={cx("flex flex-col items-center gap-3 rounded-lg border border-line p-4", !m.is_active && "opacity-60")}>
                  <QrMeja meja={m} />
                  <p className="font-display text-lg font-semibold text-ink">
                    Meja {m.label}{!m.is_active && <span className="ml-2 text-sm font-medium text-ink-muted">(nonaktif)</span>}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" onClick={() => unduh(m)}><Download aria-hidden className="size-4" />Unduh</Button>
                    <Button variant="secondary" onClick={() => setGanti(m)}><RefreshCw aria-hidden className="size-4" />Ganti QR</Button>
                    <Button variant="ghost" onClick={() => ubah(m, { is_active: !m.is_active })}>{m.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!ganti}
        onClose={() => setGanti(null)}
        title={`Ganti QR Meja ${ganti?.label ?? ""}?`}
        body="QR lama langsung tidak berlaku. Cetak dan tempel QR yang baru di meja."
        confirmLabel="Ganti QR"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={async () => {
          const m = ganti;
          setGanti(null);
          if (m) await ubah(m, { ganti_token: true });
        }}
      />
    </div>
  );
}
