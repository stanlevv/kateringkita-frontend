// Komponen BannerForm: formulir banner beranda aplikasi pembeli, dipakai di dua tempat: /banner (penjual mengajukan
// banner tokonya) dan /admin/banner (admin membuat banner platform). Gambar diunggah langsung dari peramban
// (lib/upload.ts); penyimpanan dikerjakan server action yang dikirim pemanggil lewat prop saveAction.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { Banner as AlertBanner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Select } from "@/app/components/ui/Input";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { wibInputToIso, isoToWibInput } from "@/lib/format";
import { uploadPhoto } from "@/lib/upload";
import type { ActionResult } from "@/types/api";
import type { Banner, VoucherOption } from "@/types/banner";

/** Server action peminta URL unggah (parameter ke-3 uploadPhoto); admin memakai versinya sendiri. */
type UploadRequester = Parameters<typeof uploadPhoto>[2];

/**
 * Formulir banner beranda. Mode `merchant`: penjual mengajukan banner dengan tujuan halaman toko atau voucher tokonya,
 * tayang setelah disetujui admin. Mode `admin`: banner platform dengan tujuan voucher atau tanpa tujuan, ditambah
 * urutan tampil, langsung tayang.
 * @param props.mode `merchant` atau `admin`
 * @param props.banner banner yang diubah; kosong = banner baru
 * @param props.vouchers pilihan voucher untuk tujuan banner
 * @param props.saveAction server action penyimpan (id null = buat baru)
 * @param props.onSaved dipanggil setelah tersimpan
 * @param props.onClose dipanggil saat tombol Batal ditekan
 * @param props.requestUpload peminta URL unggah khusus admin (opsional)
 * @returns elemen form
 */
export function BannerForm({
  mode,
  banner,
  vouchers,
  saveAction,
  onSaved,
  onClose,
  requestUpload,
}: {
  mode: "merchant" | "admin";
  banner?: Banner | null;
  vouchers: VoucherOption[];
  saveAction: (id: number | null, input: BannerInput) => Promise<ActionResult<unknown>>;
  onSaved: () => void;
  onClose: () => void;
  requestUpload?: UploadRequester;
}) {
  // 1. State isian (waktu dalam format isian datetime-local WIB), galat per isian, galat umum, dan status unggah/simpan.
  //    Banner baru: tujuan bawaan halaman toko (penjual) atau tanpa tujuan (admin), tayang 7 hari mulai sekarang.
  const [title, setTitle] = useState(banner?.title ?? "");
  const [image, setImage] = useState(banner?.image_url ?? "");
  const [target, setTarget] = useState<string>(banner?.target ?? (mode === "merchant" ? "merchant" : "none"));
  const [promoId, setPromoId] = useState<string>(banner?.promo ? String(banner.promo.id) : "");
  const [starts, setStarts] = useState(() => isoToWibInput(banner?.starts_at ?? new Date().toISOString()));
  const [ends, setEnds] = useState(() =>
    isoToWibInput(banner?.ends_at ?? new Date(Date.now() + 7 * 86400e3).toISOString()),
  );
  const [sortOrder, setSortOrder] = useState(String(banner?.sort_order ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 2. Data yang dikirim (nama field = kontrak API); waktu diubah dari WIB ke ISO UTC. Urutan tampil hanya untuk admin.
  const input: BannerInput = {
    title: title.trim(),
    image_url: image,
    target,
    promo_id: target === "promo" && promoId ? Number(promoId) : null,
    starts_at: wibInputToIso(starts),
    ends_at: wibInputToIso(ends),
    ...(mode === "admin" ? { sort_order: Number(sortOrder) || 0 } : {}),
  };

  // 3. Unggah gambar; berhasil = alamat gambar baru dan galat gambar dihapus.
  async function chooseImage(file: File) {
    setUploading(true);
    const result = await uploadPhoto(file, "banner", requestUpload);
    setUploading(false);
    if ("error" in result) return setErrors((previous) => ({ ...previous, image_url: result.error.message }));
    setImage(result.data.public_url);
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([field]) => field !== "image_url")));
  }

  // 4. Kirim formulir.
  async function submit(event: React.FormEvent) {
    // 1. Validasi di peramban dulu; ada galat = tidak dikirim.
    event.preventDefault();
    const problems = validateBanner(input);
    setErrors(problems);
    setGeneralError(undefined);
    if (Object.keys(problems).length || saving) return;
    // 2. Simpan; galat per isian dari server ke isiannya, galat lain ke banner galat umum.
    setSaving(true);
    const result = await saveAction(banner?.id ?? null, input);
    setSaving(false);
    if ("error" in result) {
      if (result.error.fields)
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      else setGeneralError(result.error.message);
      return;
    }
    onSaved();
  }

  const submitLabel = mode === "admin" ? "Simpan banner" : banner ? "Ajukan ulang" : "Ajukan banner";
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {generalError && <AlertBanner tone="danger">{generalError}</AlertBanner>}
      <Field
        label="Judul"
        id="bf-title"
        required
        help="Teks singkat di atas gambar, 3–80 karakter."
        error={errors.title}
      >
        <Input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <Field label="Gambar banner" id="bf-image" required help="Rasio 2:1 (mis. 1200×600 px)." error={errors.image_url}>
        <FileDrop
          id="bf-image"
          maxBytes={20 * 1024 * 1024}
          onFile={chooseImage}
          onError={(message) => setErrors((previous) => ({ ...previous, image_url: message }))}
          label={uploading ? "Mengunggah…" : image ? "Ganti gambar" : "Pilih gambar"}
        />
      </Field>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari penyimpanan publik
        <img
          src={image}
          alt="Pratinjau banner"
          className="aspect-[2/1] w-full rounded-lg border border-line object-cover"
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tujuan" id="bf-target" required>
          <Select value={target} onChange={(event) => setTarget(event.target.value)}>
            {mode === "merchant" ? (
              <>
                <option value="merchant">Halaman toko</option>
                <option value="promo">Voucher toko</option>
              </>
            ) : (
              <>
                <option value="none">Tanpa tujuan</option>
                <option value="promo">Voucher</option>
              </>
            )}
          </Select>
        </Field>
        {target === "promo" && (
          <Field
            label="Voucher"
            id="bf-promo"
            required
            error={errors.promo_id}
            help={vouchers.length ? undefined : "Belum ada voucher yang tampil. Buat dulu di menu Promo."}
          >
            <Select value={promoId} onChange={(event) => setPromoId(event.target.value)}>
              <option value="">Pilih voucher</option>
              {vouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.code} — {voucher.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="bf-starts" required error={errors.starts_at}>
          <Input type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} />
        </Field>
        <Field label="Selesai (WIB)" id="bf-ends" required error={errors.ends_at}>
          <Input type="datetime-local" value={ends} onChange={(event) => setEnds(event.target.value)} />
        </Field>
      </div>
      {mode === "admin" && (
        <Field label="Urutan tampil" id="bf-sort" help="Kecil tampil lebih dulu." error={errors.sort_order}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
      )}
      {mode === "merchant" && (
        <p className="text-sm text-ink-muted">Banner tampil di beranda aplikasi setelah disetujui admin.</p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={saving} loadingText="Menyimpan…" disabled={uploading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
