"use client";

import { useState } from "react";
import { Banner as Peringatan } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Select } from "@/app/components/ui/Input";
import { cekBanner, type IsianBanner } from "@/lib/banner";
import { inputWibKeIso, isoKeInputWib } from "@/lib/format";
import { unggahFoto } from "@/lib/unggah";
import type { ActionResult } from "@/types/api";
import type { Banner, PilihanVoucher } from "@/types/banner";

type Minta = Parameters<typeof unggahFoto>[2];

/**
 * Form banner beranda. `toko`: penjual mengajukan (tujuan halaman toko / voucher tokonya, butuh persetujuan admin).
 * `admin`: banner platform (tanpa tujuan / voucher, urutan tampil), langsung tayang.
 */
export function BannerForm({ mode, banner, vouchers, simpan, onSaved, onClose, mintaUnggah }: {
  mode: "toko" | "admin"; banner?: Banner | null; vouchers: PilihanVoucher[];
  simpan: (id: number | null, input: IsianBanner) => Promise<ActionResult<unknown>>;
  onSaved: () => void; onClose: () => void; mintaUnggah?: Minta;
}) {
  const [title, setTitle] = useState(banner?.title ?? "");
  const [image, setImage] = useState(banner?.image_url ?? "");
  const [target, setTarget] = useState<string>(banner?.target ?? (mode === "toko" ? "merchant" : "none"));
  const [promoId, setPromoId] = useState<string>(banner?.promo ? String(banner.promo.id) : "");
  const [starts, setStarts] = useState(() => isoKeInputWib(banner?.starts_at ?? new Date().toISOString()));
  const [ends, setEnds] = useState(() => isoKeInputWib(banner?.ends_at ?? new Date(Date.now() + 7 * 86400e3).toISOString()));
  const [urutan, setUrutan] = useState(String(banner?.sort_order ?? 0));
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string>();
  const [mengunggah, setMengunggah] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  const input: IsianBanner = {
    title: title.trim(), image_url: image, target, promo_id: target === "promo" && promoId ? Number(promoId) : null,
    starts_at: inputWibKeIso(starts), ends_at: inputWibKeIso(ends), ...(mode === "admin" ? { sort_order: Number(urutan) || 0 } : {}),
  };

  async function pilihGambar(f: File) {
    setMengunggah(true);
    const r = await unggahFoto(f, "banner", mintaUnggah);
    setMengunggah(false);
    if ("error" in r) return setGalat((g) => ({ ...g, image_url: r.error.message }));
    setImage(r.data.public_url);
    setGalat((g) => Object.fromEntries(Object.entries(g).filter(([k]) => k !== "image_url")));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const masalah = cekBanner(input);
    setGalat(masalah);
    setUmum(undefined);
    if (Object.keys(masalah).length || menyimpan) return;
    setMenyimpan(true);
    const r = await simpan(banner?.id ?? null, input);
    setMenyimpan(false);
    if ("error" in r) {
      if (r.error.fields) setGalat(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
      else setUmum(r.error.message);
      return;
    }
    onSaved();
  }

  const tombol = mode === "admin" ? "Simpan banner" : banner ? "Ajukan ulang" : "Ajukan banner";
  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      {umum && <Peringatan tone="danger">{umum}</Peringatan>}
      <Field label="Judul" id="bf-title" required help="Teks singkat di atas gambar, 3–80 karakter." error={galat.title}>
        <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Gambar banner" id="bf-image" required help="Rasio 2:1 (mis. 1200×600 px)." error={galat.image_url}>
        <FileDrop id="bf-image" maxBytes={20 * 1024 * 1024} onFile={pilihGambar} onError={(m) => setGalat((g) => ({ ...g, image_url: m }))}
          label={mengunggah ? "Mengunggah…" : image ? "Ganti gambar" : "Pilih gambar"} />
      </Field>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari penyimpanan publik
        <img src={image} alt="Pratinjau banner" className="aspect-[2/1] w-full rounded-lg border border-line object-cover" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tujuan" id="bf-target" required>
          <Select value={target} onChange={(e) => setTarget(e.target.value)}>
            {mode === "toko" ? (
              <><option value="merchant">Halaman toko</option><option value="promo">Voucher toko</option></>
            ) : (
              <><option value="none">Tanpa tujuan</option><option value="promo">Voucher</option></>
            )}
          </Select>
        </Field>
        {target === "promo" && (
          <Field label="Voucher" id="bf-promo" required error={galat.promo_id}
            help={vouchers.length ? undefined : "Belum ada voucher yang tampil. Buat dulu di menu Promo."}>
            <Select value={promoId} onChange={(e) => setPromoId(e.target.value)}>
              <option value="">Pilih voucher</option>
              {vouchers.map((v) => <option key={v.id} value={v.id}>{v.code} — {v.label}</option>)}
            </Select>
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="bf-starts" required error={galat.starts_at}>
          <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
        </Field>
        <Field label="Selesai (WIB)" id="bf-ends" required error={galat.ends_at}>
          <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
        </Field>
      </div>
      {mode === "admin" && (
        <Field label="Urutan tampil" id="bf-sort" help="Kecil tampil lebih dulu." error={galat.sort_order}>
          <Input type="number" inputMode="numeric" min={0} max={999} value={urutan} onChange={(e) => setUrutan(e.target.value)} />
        </Field>
      )}
      {mode === "toko" && <p className="text-sm text-ink-muted">Banner tampil di beranda aplikasi setelah disetujui admin.</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button type="submit" loading={menyimpan} loadingText="Menyimpan…" disabled={mengunggah}>{tombol}</Button>
      </div>
    </form>
  );
}
