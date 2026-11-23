// Komponen PayoutBankAccount: bagian "Pembayaran & pencairan" di /pengaturan. Pencairan = transfer bagian toko
// dari pembayaran non-tunai (yang masuk ke KateringKita lewat Midtrans) ke rekening penjual oleh admin. Menampilkan
// saldo belum dicairkan, rekening pencairan, dan riwayat pencairan (GET /merchant/payouts lewat page.tsx); rekening
// disimpan lewat server action saveBankAccount (app/actions/payouts.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input, Select } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { saveBankAccount } from "@/app/actions/payouts";
import { callAction } from "@/lib/action";
import { formatRupiah, formatDate } from "@/lib/format";
import type { MyPayouts } from "@/types/payout";

/** Isian formulir rekening (kunci = nama field API); kata sandi wajib untuk mengganti rekening. */
type BankAccountInput = { bank: string; account_number: string; account_name: string; password: string };
/** Isi formulir dari rekening tersimpan; kata sandi selalu kosong. */
const toFormValues = (payouts: MyPayouts | null): BankAccountInput => ({
  bank: payouts?.account?.bank ?? "",
  account_number: payouts?.account?.account_number ?? "",
  account_name: payouts?.account?.account_name ?? "",
  password: "",
});

/**
 * Saldo, rekening, dan riwayat pencairan. Berada di luar formulir utama pengaturan: rekening tersimpan langsung dan
 * wajib kata sandi akun (dicek backend). Bila belum ada rekening, formulir langsung terbuka.
 * @param props.data data pencairan dari backend, null = gagal dimuat
 * @returns ringkasan saldo, rekening atau formulirnya, dan riwayat
 */
export function PayoutBankAccount({ data }: { data: MyPayouts | null }) {
  // 1. Data pencairan terakhir, mode ubah, isi formulir, galat, dan status simpan.
  const [payoutData, setPayoutData] = useState(data);
  const [editing, setEditing] = useState(!data?.account);
  const [values, setValues] = useState(() => toFormValues(data));
  const [errors, setErrors] = useState<Partial<Record<keyof BankAccountInput, string>>>({});
  const [saving, setSaving] = useState(false);

  // 2. Data gagal dimuat.
  if (!payoutData)
    return (
      <p role="alert" className="text-danger">
        Data pencairan belum bisa dimuat. Muat ulang halaman.
      </p>
    );

  // 3. Pengubah isian (menghapus galat isian itu), batal ubah, dan simpan.
  const setField = (field: keyof BankAccountInput, value: string) => {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  function cancelEdit() {
    setValues(toFormValues(payoutData));
    setErrors({});
    setEditing(false);
  }
  async function submit(event: FormEvent) {
    // 1. Kirim sekali saja.
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveBankAccount(values));
    setSaving(false);
    // 2. Galat per isian dari server ditampilkan di isiannya; galat umum menjadi toast.
    if ("error" in result) {
      if (result.error.fields)
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      else toast({ tone: "danger", message: result.error.message });
      return;
    }
    // 3. Berhasil: tampilkan rekening baru dan tutup formulir.
    setPayoutData(result.data);
    setValues(toFormValues(result.data));
    setErrors({});
    setEditing(false);
    toast({ tone: "success", message: "Rekening pencairan disimpan" });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted">
        Pembeli bisa bayar tunai langsung ke Anda, atau lewat Virtual Account dan bayar online (QRIS, e-wallet) ke
        KateringKita. Bagian toko dari pembayaran non-tunai ditransfer admin ke rekening di bawah setelah pesanan
        selesai.
      </p>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Saldo belum dicairkan</dt>
          <dd className="font-mono text-xl font-semibold text-ink">{formatRupiah(payoutData.balance.amount)}</dd>
          <dd className="text-sm text-ink-muted">
            {payoutData.balance.orders} pesanan selesai
            {payoutData.balance.since ? ` sejak ${formatDate(payoutData.balance.since)}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Bagian toko</dt>
          <dd className="text-sm text-ink">
            Subtotal pesanan dikurangi promo toko. Biaya layanan, promo KateringKita, dan biaya Midtrans tidak memotong
            bagian toko.
          </dd>
        </div>
      </dl>

      {payoutData.account && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-subtle p-4">
          <div>
            <p className="font-semibold text-ink">
              {payoutData.account.bank_name} · <span className="font-mono">{payoutData.account.account_number}</span>
            </p>
            <p className="text-ink-muted">a.n. {payoutData.account.account_name}</p>
          </div>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Ganti rekening
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex max-w-md flex-col gap-4" aria-label="Rekening pencairan">
          {!payoutData.account && (
            <p className="text-sm font-medium text-warning">Isi rekening agar saldo bisa dicairkan.</p>
          )}
          <Field label="Bank atau e-wallet" id="rk-bank" required error={errors.bank}>
            <Select value={values.bank} onChange={(event) => setField("bank", event.target.value)}>
              <option value="">Pilih bank atau e-wallet</option>
              {payoutData.banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Nomor rekening"
            id="rk-account_number"
            required
            help="Untuk e-wallet, isi nomor HP yang terdaftar."
            error={errors.account_number}
          >
            <Input
              inputMode="numeric"
              autoComplete="off"
              maxLength={30}
              value={values.account_number}
              onChange={(event) => setField("account_number", event.target.value)}
            />
          </Field>
          <Field
            label="Nama pemilik rekening"
            id="rk-account_name"
            required
            help="Sesuai buku tabungan atau akun e-wallet."
            error={errors.account_name}
          >
            <Input
              autoComplete="off"
              maxLength={100}
              value={values.account_name}
              onChange={(event) => setField("account_name", event.target.value)}
            />
          </Field>
          <Field
            label="Kata sandi akun"
            id="rk-password"
            required
            help="Demi keamanan, rekening hanya bisa diganti dengan kata sandi."
            error={errors.password}
          >
            <Input
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => setField("password", event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving} loadingText="Menyimpan…">
              Simpan rekening
            </Button>
            {payoutData.account && (
              <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                Batal
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-ink">Riwayat pencairan</h3>
        {payoutData.payouts.length === 0 ? (
          <p className="text-ink-muted">Belum ada pencairan.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {payoutData.payouts.map((payout) => (
              <li key={payout.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-3">
                <span className="text-ink">
                  {formatDate(payout.created_at)} · {payout.orders_count} pesanan · {payout.bank_name}{" "}
                  {payout.account_number}
                </span>
                <span className="font-mono font-semibold text-ink">{formatRupiah(payout.amount)}</span>
                <span className="w-full text-sm text-ink-muted">
                  Ref. {payout.reference}
                  {payout.note ? ` · ${payout.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
