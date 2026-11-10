"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { saveRekening } from "@/app/actions/pencairan";
import { panggil } from "@/lib/aksi";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { PencairanSaya } from "@/types/pencairan";

type Isian = { bank: string; account_number: string; account_name: string; password: string };
const dari = (d: PencairanSaya | null): Isian => ({
  bank: d?.account?.bank ?? "", account_number: d?.account?.account_number ?? "", account_name: d?.account?.account_name ?? "", password: "",
});

/**
 * F26: pembayaran non-tunai masuk ke KateringKita lewat Midtrans; admin mentransfer bagian toko ke rekening ini.
 * Di luar form utama: tersimpan langsung, wajib kata sandi (dicek backend). `data` null = gagal dimuat.
 */
export function RekeningPencairan({ data }: { data: PencairanSaya | null }) {
  const [d, setD] = useState(data);
  const [ubah, setUbah] = useState(!data?.account);
  const [v, setV] = useState(() => dari(data));
  const [galat, setGalat] = useState<Partial<Record<keyof Isian, string>>>({});
  const [sibuk, setSibuk] = useState(false);

  if (!d) return <p role="alert" className="text-danger">Data pencairan belum bisa dimuat. Muat ulang halaman.</p>;

  const set = (k: keyof Isian, nilai: string) => {
    setGalat((g) => ({ ...g, [k]: undefined }));
    setV((p) => ({ ...p, [k]: nilai }));
  };
  function batal() {
    setV(dari(d));
    setGalat({});
    setUbah(false);
  }
  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    const r = await panggil(() => saveRekening(v));
    setSibuk(false);
    if ("error" in r) {
      if (r.error.fields) setGalat(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
      else toast({ tone: "danger", message: r.error.message });
      return;
    }
    setD(r.data);
    setV(dari(r.data));
    setGalat({});
    setUbah(false);
    toast({ tone: "success", message: "Rekening pencairan disimpan" });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted">
        Pembeli bisa bayar tunai langsung ke Anda, atau lewat Virtual Account dan bayar online (QRIS, e-wallet) ke KateringKita.
        Bagian toko dari pembayaran non-tunai ditransfer admin ke rekening di bawah setelah pesanan selesai.
      </p>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Saldo belum dicairkan</dt>
          <dd className="font-mono text-xl font-semibold text-ink">{formatRupiah(d.balance.amount)}</dd>
          <dd className="text-sm text-ink-muted">
            {d.balance.orders} pesanan selesai{d.balance.since ? ` sejak ${formatTanggal(d.balance.since)}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Bagian toko</dt>
          <dd className="text-sm text-ink">Subtotal pesanan dikurangi promo toko. Biaya layanan, promo KateringKita, dan biaya Midtrans tidak memotong bagian toko.</dd>
        </div>
      </dl>

      {d.account && !ubah ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-subtle p-4">
          <div>
            <p className="font-semibold text-ink">{d.account.bank_name} · <span className="font-mono">{d.account.account_number}</span></p>
            <p className="text-ink-muted">a.n. {d.account.account_name}</p>
          </div>
          <Button variant="secondary" onClick={() => setUbah(true)}>Ganti rekening</Button>
        </div>
      ) : (
        <form onSubmit={simpan} noValidate className="flex max-w-md flex-col gap-4" aria-label="Rekening pencairan">
          {!d.account && <p className="text-sm font-medium text-warning">Isi rekening agar saldo bisa dicairkan.</p>}
          <Field label="Bank atau e-wallet" id="rk-bank" required error={galat.bank}>
            <Select value={v.bank} onChange={(e) => set("bank", e.target.value)}>
              <option value="">Pilih bank atau e-wallet</option>
              {d.banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Nomor rekening" id="rk-account_number" required help="Untuk e-wallet, isi nomor HP yang terdaftar." error={galat.account_number}>
            <Input inputMode="numeric" autoComplete="off" maxLength={30} value={v.account_number} onChange={(e) => set("account_number", e.target.value)} />
          </Field>
          <Field label="Nama pemilik rekening" id="rk-account_name" required help="Sesuai buku tabungan atau akun e-wallet." error={galat.account_name}>
            <Input autoComplete="off" maxLength={100} value={v.account_name} onChange={(e) => set("account_name", e.target.value)} />
          </Field>
          <Field label="Kata sandi akun" id="rk-password" required help="Demi keamanan, rekening hanya bisa diganti dengan kata sandi." error={galat.password}>
            <Input type="password" autoComplete="current-password" value={v.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={sibuk} loadingText="Menyimpan…">Simpan rekening</Button>
            {d.account && <Button variant="ghost" onClick={batal} disabled={sibuk}>Batal</Button>}
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-ink">Riwayat pencairan</h3>
        {d.payouts.length === 0 ? (
          <p className="text-ink-muted">Belum ada pencairan.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {d.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-3">
                <span className="text-ink">{formatTanggal(p.created_at)} · {p.orders_count} pesanan · {p.bank_name} {p.account_number}</span>
                <span className="font-mono font-semibold text-ink">{formatRupiah(p.amount)}</span>
                <span className="w-full text-sm text-ink-muted">Ref. {p.reference}{p.note ? ` · ${p.note}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
