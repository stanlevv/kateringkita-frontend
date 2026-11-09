"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { panggil } from "@/lib/aksi";
import { saveProfile } from "@/app/actions/profile";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { cx, fokus } from "@/app/components/ui/cx";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { formatTelepon } from "@/lib/format";
import { unggahFoto } from "@/lib/unggah";
import { cekProfil } from "@/lib/schemas";
import type { MerchantProfile } from "@/types/profile";
import type { PickupPoint } from "@/types/meta";
import type { Meja } from "@/types/meja";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { PesanMeja } from "./PesanMeja";
import { PickupPointPicker } from "./PickupPointPicker";

const BAGIAN = [
  { id: "profil", judul: "Profil toko" },
  { id: "operasional", judul: "Operasional" },
  { id: "titik-temu", judul: "Titik temu" },
  { id: "pembayaran", judul: "Pembayaran" },
  { id: "meja", judul: "Pesan dari meja" },
  { id: "akun", judul: "Akun" },
] as const;
const MODE = [
  { v: "daily", label: "Harian", info: "Porsi satuan yang dijual setiap hari." },
  { v: "event", label: "Acara", info: "Pesanan besar yang dipesan lebih dulu." },
  { v: "both", label: "Keduanya", info: "Harian dan acara sekaligus." },
] as const;
const LABEL: Record<string, string> = {
  business_name: "Nama usaha", description: "Deskripsi", address: "Alamat", wa_number: "Nomor WA toko", open_time: "Jam buka", close_time: "Jam tutup",
  hold_minutes: "Durasi tahan pesanan", logo_url: "Logo toko", qris_image_url: "QRIS", daily_revenue_target: "Target omzet harian", pickup_point_ids: "Titik temu",
};
const MB = 1024 * 1024;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

type Isian = {
  business_name: string; description: string; address: string; wa_number: string; service_mode: MerchantProfile["service_mode"];
  open_time: string; close_time: string; hold_minutes: string; daily_revenue_target: string; pickup_point_ids: number[];
  logo_url: string | null; qris_image_url: string | null;
};

const awalDari = (p: MerchantProfile): Isian => ({
  business_name: p.business_name, description: p.description ?? "", address: p.address, wa_number: p.wa_number, service_mode: p.service_mode,
  open_time: p.open_time, close_time: p.close_time, hold_minutes: String(p.hold_minutes), daily_revenue_target: String(p.daily_revenue_target),
  pickup_point_ids: p.pickup_point_ids, logo_url: p.logo_url, qris_image_url: p.qris_image_url,
});
const kunci = (i: Isian) => JSON.stringify({ ...i, pickup_point_ids: [...i.pickup_point_ids].sort((a, b) => a - b) });

function Bagian({ id, judul, sorot, children }: { id: string; judul: string; sorot: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className={cx("flex scroll-mt-24 flex-col gap-4 rounded-lg border border-line bg-surface p-4 transition-shadow duration-200 motion-reduce:transition-none sm:p-6", sorot && "ring-2 ring-info")}>
      <h2 id={`${id}-judul`} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">{judul}</h2>
      {children}
    </section>
  );
}

/** Logo / QRIS: pratinjau, unggah langsung ke penyimpanan (FE-08), hapus (PG-E3). */
function Gambar({ id, nama, jenis, url, error, onChange, onBusy }: { id: string; nama: "Logo toko" | "QRIS"; jenis: "logo" | "qris"; url: string | null; error?: string; onChange: (u: string | null) => void; onBusy: (b: boolean) => void }) {
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const unggahKe = useRef(0); // token unggahan terbaru; respons lama diabaikan
  const berjalan = useRef(false);
  const wadah = useRef<HTMLDivElement>(null);
  const pindahFokus = useRef(false);
  // Tombol Hapus hilang bersama gambar; fokus dipindah ke tombol pilih berkas.
  useEffect(() => {
    if (!pindahFokus.current) return;
    pindahFokus.current = false;
    wadah.current?.querySelector("button")?.focus();
  }, [url]);
  // Pindah ke bagian lain (Hapus, pilih ulang, atau form direset): unggahan yang masih jalan dibatalkan.
  function batalkan() {
    unggahKe.current++;
    if (berjalan.current) {
      berjalan.current = false;
      setSibuk(false);
      onBusy(false);
    }
  }
  useEffect(() => () => { unggahKe.current++; }, []); // form direset (key baru): respons lama diabaikan
  async function pilih(f: File) {
    batalkan();
    const id = unggahKe.current;
    setGalat(null);
    setSelesai(false);
    berjalan.current = true;
    setSibuk(true);
    onBusy(true);
    const r = await unggahFoto(f, jenis);
    if (id !== unggahKe.current) return;
    berjalan.current = false;
    setSibuk(false);
    onBusy(false);
    if ("error" in r) return setGalat(r.error.message);
    setSelesai(true);
    onChange(r.data.public_url);
  }
  const pesan = galat ?? error;
  return (
    <div role="group" aria-label={nama} className="flex flex-col gap-3">
      {url ? (
        <div className="relative aspect-square w-40 overflow-hidden rounded-md bg-subtle">
          <Image src={url} alt={nama} fill unoptimized sizes="160px" className="object-contain" />
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Belum ada gambar.</p>
      )}
      {sibuk && <p role="status" className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />Mengunggah…</p>}
      {selesai && !sibuk && <p role="status" className="text-sm text-success">{nama === "QRIS" ? "QRIS" : "Logo"} terunggah.</p>}
      {pesan && <p role="alert" className="flex items-center gap-2 text-sm text-danger"><TriangleAlert aria-hidden className="size-4" />{pesan}</p>}
      <div ref={wadah}><FileDrop id={id} maxBytes={5 * MB} onFile={(f) => void pilih(f)} onError={setGalat} label={url ? `Ganti ${nama === "QRIS" ? "QRIS" : "logo"}` : `Pilih ${nama === "QRIS" ? "QRIS" : "logo"}`} /></div>
      {url && <div><Button variant="ghost" onClick={() => { batalkan(); pindahFokus.current = true; setGalat(null); setSelesai(false); onChange(null); }}><X aria-hidden className="size-4" />Hapus gambar</Button></div>}
    </div>
  );
}

type Props = {
  profile: MerchantProfile; pickupPoints: PickupPoint[] | null; user: { full_name: string; phone: string; email: string }; lengkapi?: string;
  tables?: Meja[] | null; // F21; undefined = belum dimuat (pratinjau)
};

/** M-10, M-03, PG-*: pengaturan toko. */
export function SettingsForm({ profile, pickupPoints, user, lengkapi, tables = [] }: Props) {
  const [awal, setAwal] = useState(() => awalDari(profile));
  const [v, setV] = useState<Isian>(awal);
  const [tersentuh, setTersentuh] = useState<Set<string>>(new Set());
  const [dicoba, setDicoba] = useState(false);
  const [fokusKey, setFokusKey] = useState(0);
  const [server, setServer] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [mengunggah, setMengunggah] = useState(0);
  const [resetKe, setResetKe] = useState(0);
  const router = useRouter();
  const [sorot, setSorot] = useState<string | null>(() => (BAGIAN.some((b) => b.id === lengkapi) ? lengkapi! : null));

  // PG-A2: gulir ke bagian yang belum lengkap, sorot 3 detik.
  useEffect(() => {
    const el = BAGIAN.some((b) => b.id === lengkapi) ? document.getElementById(lengkapi!) : null;
    if (!el) return;
    const kurangGerak = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: kurangGerak ? "auto" : "smooth", block: "start" });
    el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    const h = setTimeout(() => setSorot(null), 3000);
    return () => clearTimeout(h);
  }, [lengkapi]);

  const dirty = kunci(v) !== kunci(awal);
  const guard = useUnsavedGuard(dirty);

  const set = <K extends keyof Isian>(k: K, nilai: Isian[K]) => { setServer({}); setV((p) => ({ ...p, [k]: nilai })); };
  const sentuh = (k: string) => setTersentuh((p) => new Set(p).add(k));
  const blur = (k: string) => () => sentuh(k);
  const input = {
    business_name: v.business_name, description: v.description, logo_url: v.logo_url, address: v.address, wa_number: v.wa_number, service_mode: v.service_mode,
    open_time: v.open_time, close_time: v.close_time, hold_minutes: num(v.hold_minutes), daily_revenue_target: num(v.daily_revenue_target),
    qris_image_url: v.qris_image_url, pickup_point_ids: v.pickup_point_ids,
  };
  const semua = cekProfil(input);
  const galatSemua = dicoba ? { ...server, ...semua } : semua;
  const galat = (k: string) => (dicoba || tersentuh.has(k) ? galatSemua[k] : undefined);
  const ringkasan = dicoba ? Object.entries(galatSemua).map(([k, m]) => ({ id: `pg-${k}`, message: `${LABEL[k] ?? k}: ${m}` })) : [];

  function batal() {
    setResetKe((n) => n + 1); // pasang ulang Gambar: unggahan yang berjalan dibatalkan
    setMengunggah(0);
    setV(awal);
    setServer({});
    setTersentuh(new Set());
    setDicoba(false);
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || mengunggah > 0) return; // Enter di dalam kolom tidak boleh menyimpan tanpa perubahan atau saat unggahan berjalan
    if (Object.keys(semua).length > 0) {
      setDicoba(true);
      setFokusKey((n) => n + 1);
      return;
    }
    if (menyimpan) return;
    setMenyimpan(true);
    const r = await panggil(() => saveProfile(input));
    setMenyimpan(false);
    if ("error" in r) {
      if (r.error.fields) {
        setServer(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
        setDicoba(true);
        setFokusKey((n) => n + 1);
      } else {
        toast({ tone: "danger", message: r.error.message });
      }
      return;
    }
    const baru = awalDari(r.data); // bentuk resmi dari server (mis. deskripsi kosong -> null)
    setAwal(baru);
    setV(baru);
    setDicoba(false);
    setTersentuh(new Set());
    toast({ tone: "success", message: "Pengaturan disimpan" });
    router.refresh(); // status buka/tutup di bilah atas mengikuti jam baru
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Bagian pengaturan" className="lg:sticky lg:top-6">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {BAGIAN.map((b) => (
              <li key={b.id}>
                <a href={`#${b.id}`} className={cx("inline-flex min-h-11 items-center rounded-md px-3 font-medium text-ink hover:bg-subtle", fokus)}>{b.judul}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <form id="pg-form" onSubmit={kirim} noValidate className="flex flex-col gap-6">
            <ErrorSummary errors={ringkasan} focusKey={fokusKey} />

            <Bagian id="profil" judul="Profil toko" sorot={sorot === "profil"}>
              <Field label="Nama usaha" id="pg-business_name" required error={galat("business_name")}>
                <Input value={v.business_name} maxLength={150} onChange={(e) => set("business_name", e.target.value)} onBlur={blur("business_name")} />
              </Field>
              <Field label="Deskripsi" id="pg-description" help={`${v.description.length}/500 karakter`} error={galat("description")}>
                <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} onBlur={blur("description")} />
              </Field>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-ink">Logo toko</p>
                <Gambar key={`logo-${resetKe}`} id="pg-logo_url" nama="Logo toko" jenis="logo" url={v.logo_url} error={galat("logo_url")} onChange={(u) => set("logo_url", u)} onBusy={(b) => setMengunggah((n) => n + (b ? 1 : -1))} />
              </div>
              <Field label="Alamat" id="pg-address" required error={galat("address")}>
                <Input value={v.address} maxLength={255} onChange={(e) => set("address", e.target.value)} onBlur={blur("address")} />
              </Field>
              <Field label="Nomor WA toko" id="pg-wa_number" required help="Pesanan masuk ke nomor ini. Contoh: 081234567890" error={galat("wa_number")}>
                <Input type="tel" inputMode="numeric" value={v.wa_number} onChange={(e) => set("wa_number", e.target.value.replace(/\D/g, ""))} onBlur={blur("wa_number")} />
              </Field>
            </Bagian>

            <Bagian id="operasional" judul="Operasional" sorot={sorot === "operasional"}>
              <fieldset className="flex flex-col">
                <legend className="mb-1 text-sm font-medium text-ink">Mode layanan</legend>
                {MODE.map((m) => (
                  <label key={m.v} className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
                    <input type="radio" name="service_mode" value={m.v} checked={v.service_mode === m.v} onChange={() => set("service_mode", m.v)} className={cx("size-5 accent-primary", fokus)} />
                    <span>{m.label} <span className="text-sm text-ink-muted">· {m.info}</span></span>
                  </label>
                ))}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jam buka" id="pg-open_time" required error={galat("open_time")}>
                  <Input type="time" value={v.open_time} onChange={(e) => set("open_time", e.target.value)} onBlur={blur("open_time")} />
                </Field>
                <Field label="Jam tutup" id="pg-close_time" required help="Harus setelah jam buka." error={galat("close_time")}>
                  <Input type="time" value={v.close_time} onChange={(e) => set("close_time", e.target.value)} onBlur={blur("close_time")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Durasi tahan pesanan (menit)" id="pg-hold_minutes" required help="Pesanan ditahan selama ini menunggu konfirmasi. 1 sampai 30 menit." error={galat("hold_minutes")}>
                  <Input type="number" inputMode="numeric" min={1} max={30} step={1} value={v.hold_minutes} onChange={(e) => set("hold_minutes", e.target.value)} onBlur={blur("hold_minutes")} />
                </Field>
                <Field label="Target omzet harian (Rp)" id="pg-daily_revenue_target" help="Isi 0 bila tidak memakai target." error={galat("daily_revenue_target")}>
                  <Input type="number" inputMode="numeric" min={0} step={1} value={v.daily_revenue_target} onChange={(e) => set("daily_revenue_target", e.target.value)} onBlur={blur("daily_revenue_target")} />
                </Field>
              </div>
            </Bagian>

            <Bagian id="titik-temu" judul="Titik temu" sorot={sorot === "titik-temu"}>
              <p className="text-ink-muted">Pilih tempat pembeli bisa mengambil pesanan. Minimal satu.</p>
              <PickupPointPicker points={pickupPoints} value={v.pickup_point_ids} onChange={(ids) => set("pickup_point_ids", ids)} onBlur={blur("pickup_point_ids")} error={pickupPoints ? galat("pickup_point_ids") : undefined} />
            </Bagian>

            <Bagian id="pembayaran" judul="Pembayaran" sorot={sorot === "pembayaran"}>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-ink">QRIS statis (opsional)</p>
                <p className="text-sm text-ink-muted">Gambar kode QRIS toko yang ditampilkan ke pembeli.</p>
                <Gambar key={`qris-${resetKe}`} id="pg-qris_image_url" nama="QRIS" jenis="qris" url={v.qris_image_url} error={galat("qris_image_url")} onChange={(u) => set("qris_image_url", u)} onBusy={(b) => setMengunggah((n) => n + (b ? 1 : -1))} />
              </div>
            </Bagian>
          </form>

          {/* di luar form utama: aksinya tersimpan langsung, tidak ikut "Simpan perubahan" */}
          <Bagian id="meja" judul="Pesan dari meja" sorot={sorot === "meja"}>
            <PesanMeja aktifAwal={profile.dine_in_enabled} mejaAwal={tables} />
          </Bagian>

          <Bagian id="akun" judul="Akun" sorot={sorot === "akun"}>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div><dt className="text-sm text-ink-muted">Nama pemilik</dt><dd className="font-medium text-ink">{user.full_name}</dd></div>
              <div><dt className="text-sm text-ink-muted">Nomor WA login</dt><dd className="font-medium text-ink">{formatTelepon(user.phone)}</dd></div>
              <div><dt className="text-sm text-ink-muted">Email</dt><dd className="break-all font-medium text-ink">{user.email || "-"}</dd></div>
            </dl>
            <ChangePasswordForm />
          </Bagian>

          {dirty && (
            <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-lg border border-line bg-surface p-3 shadow-lg">
              <p className="mr-auto text-ink-muted">Ada perubahan yang belum disimpan.</p>
              <Button variant="secondary" onClick={batal} disabled={menyimpan}>Batalkan perubahan</Button>
              <Button type="submit" form="pg-form" loading={menyimpan} loadingText="Menyimpan…" disabled={mengunggah > 0}>Simpan perubahan</Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={guard.open} onClose={guard.cancel} title="Buang perubahan?" body="Perubahan pada pengaturan ini belum disimpan." confirmLabel="Buang perubahan" cancelLabel="Tetap di sini" tone="danger" onConfirm={guard.confirm} />
    </>
  );
}
