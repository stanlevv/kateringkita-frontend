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

type UploadRequester = Parameters<typeof uploadPhoto>[2];

/**
 * Form banner beranda. `toko`: penjual mengajukan (tujuan halaman toko / voucher tokonya, butuh persetujuan admin).
 * `admin`: banner platform (tanpa tujuan / voucher, urutan tampil), langsung tayang.
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

  const input: BannerInput = {
    title: title.trim(),
    image_url: image,
    target,
    promo_id: target === "promo" && promoId ? Number(promoId) : null,
    starts_at: wibInputToIso(starts),
    ends_at: wibInputToIso(ends),
    ...(mode === "admin" ? { sort_order: Number(sortOrder) || 0 } : {}),
  };

  async function chooseImage(file: File) {
    setUploading(true);
    const result = await uploadPhoto(file, "banner", requestUpload);
    setUploading(false);
    if ("error" in result) return setErrors((previous) => ({ ...previous, image_url: result.error.message }));
    setImage(result.data.public_url);
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([field]) => field !== "image_url")));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problems = validateBanner(input);
    setErrors(problems);
    setGeneralError(undefined);
    if (Object.keys(problems).length || saving) return;
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
