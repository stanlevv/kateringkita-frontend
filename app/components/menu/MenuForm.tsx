// Komponen MenuForm: formulir tambah dan ubah menu (info dasar, foto, harga, stok, pre-order, opsi) dengan pratinjau
// pembeli. Dipakai /menu/baru dan /menu/[id] milik penjual, serta menu toko di panel admin. Bawaannya disimpan lewat
// server action saveMenu (app/actions/menus.ts);
// foto diunggah langsung dari peramban lewat lib/upload.ts.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { saveMenu } from "@/app/actions/menus";
import { callAction } from "@/lib/action";
import { uploadPhoto } from "@/lib/upload";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { Input, Select, Textarea } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { formatRupiah } from "@/lib/format";
import { marginPercent } from "@/lib/menu-filter";
import { validateFields, menuFormSchema } from "@/lib/schemas";
import type { Category } from "@/types/meta";
import type { MerchantMenu } from "@/types/menu";
import type { ActionResult } from "@/types/api";
import { ExtraPhotos } from "./ExtraPhotos";
import { MenuPreview } from "./MenuPreview";
import { FormSection } from "./FormSection";
import { MenuPhotoField } from "./MenuPhotoField";
import { OptionsEditor } from "./OptionsEditor";
import { fieldLabel, initialValues, serialize, toNumber, type FormValues, type PhotoUpload } from "./menu-form-values";

/**
 * Formulir tambah/ubah menu. Galat tampil setelah isian disentuh; saat dikirim, semua galat tampil di ringkasan
 * atas. Perubahan yang belum disimpan dijaga dialog "Buang perubahan?" saat meninggalkan halaman.
 * HPP = harga pokok produksi (modal per porsi), tidak terlihat pembeli.
 * @param props.categories daftar kategori
 * @param props.menu menu yang diubah; ada = mode ubah, tidak ada = mode tambah
 * @param props.prefill harga dan HPP awal dari Kalkulator HPP (opsional)
 * @param props.save server action penyimpan (bawaan saveMenu milik penjual; panel admin memberi versi atas nama toko)
 * @param props.doneHref halaman tujuan setelah tersimpan (bawaan /menu)
 * @param props.canUploadPhoto `false` menyembunyikan unggah foto (admin tidak bisa mengunggah atas nama toko)
 * @returns formulir, pratinjau pembeli, dan dialog penjaga perubahan
 */
export function MenuForm({
  categories,
  menu,
  prefill,
  save = saveMenu,
  doneHref = "/menu",
  canUploadPhoto = true,
}: {
  categories: Category[];
  menu?: MerchantMenu;
  prefill?: { hpp?: number; price?: number };
  save?: (id: number | null, input: unknown) => Promise<ActionResult<MerchantMenu>>;
  doneHref?: string;
  canUploadPhoto?: boolean;
}) {
  // 1. State isian, foto, galat, dan status simpan.
  const router = useRouter();
  const [initialSnapshot] = useState(() => serialize(initialValues(menu, prefill)));
  const [values, setValues] = useState<FormValues>(() => initialValues(menu, prefill));
  const [imageUrl, setImageUrl] = useState<string | null>(menu?.image_url ?? null);
  const [photo, setPhoto] = useState<PhotoUpload | null>(null);
  const [gallery, setGallery] = useState<string[]>(menu?.gallery ?? []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const uploadToken = useRef(0); // token unggahan terbaru; respons unggahan lama diabaikan
  // 2. Pratinjau foto memakai blob URL (alamat sementara berkas lokal di peramban); dilepas saat komponen dilepas
  // supaya memorinya kembali.
  const photoRef = useRef(photo);
  useEffect(() => {
    photoRef.current = photo;
  });
  useEffect(
    () => () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.preview);
    },
    [],
  );

  // 3. Ada perubahan yang belum disimpan? useUnsavedGuard memasang penjaga saat meninggalkan halaman.
  const dirty =
    serialize(values) !== initialSnapshot ||
    (photo !== null && photo.status !== "gagal") ||
    imageUrl !== (menu?.image_url ?? null) ||
    JSON.stringify(gallery) !== JSON.stringify(menu?.gallery ?? []);
  const guard = useUnsavedGuard(dirty && !saved);

  // 4. Pengubah isian; setiap perubahan menghapus galat server lama.
  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  const touch = (field: string) => setTouched((previous) => new Set(previous).add(field));
  // 5. Data yang akan dikirim (nama field = kontrak API), lalu galat validasi dan ringkasannya.
  const input = {
    name: values.name,
    category_id: toNumber(values.category_id),
    description: values.description,
    image_url: imageUrl,
    gallery,
    unit_label: values.unit_label,
    price: toNumber(values.price),
    hpp: toNumber(values.hpp),
    daily_quota: toNumber(values.daily_quota),
    prep_minutes: toNumber(values.prep_minutes),
    is_preorder: values.is_preorder,
    preorder_days: values.is_preorder ? toNumber(values.preorder_days) : 0,
    min_order_qty: toNumber(values.min_order_qty),
    options: values.options.map((option) => ({ name: option.name, extra_price: toNumber(option.extra_price) })),
  };
  const clientErrors = validateFields(menuFormSchema, input);
  const allErrors = submitAttempted ? { ...serverErrors, ...clientErrors } : clientErrors;
  const errorFor = (field: string) => (submitAttempted || touched.has(field) ? allErrors[field] : undefined);
  const optionErrors = submitAttempted
    ? allErrors
    : Object.fromEntries(Object.entries(allErrors).filter(([field]) => field.startsWith("options.")));
  const summaryErrors = submitAttempted
    ? Object.entries(allErrors).map(([field, message]) => ({
        id: `mf-${field.replace(/\./g, "-")}`,
        message: `${fieldLabel(field)}: ${message}`,
      }))
    : [];
  const blur = (field: string) => () => touch(field);

  // 6. Laba dan margin untuk ditampilkan, nama kategori untuk pratinjau, dan status unggahan.
  const price = toNumber(values.price),
    hpp = toNumber(values.hpp);
  const canCalculate = Number.isFinite(price) && Number.isFinite(hpp) && price > 0;
  const margin = canCalculate ? marginPercent({ price, hpp }) : null;
  const categoryName = categories.find((category) => String(category.id) === values.category_id)?.name ?? "";
  const uploading = photo?.status === "mengunggah" || galleryUploading;

  /** Mengunggah foto utama; respons yang sudah tidak terbaru diabaikan. */
  async function upload(file: File, preview: string) {
    const token = ++uploadToken.current;
    setPhoto({ file, preview, status: "mengunggah" });
    const result = await uploadPhoto(file, "menu");
    if (token !== uploadToken.current) return;
    // Gagal: simpan pesan dan berkasnya supaya tombol "Coba unggah lagi" bisa mengulang.
    if ("error" in result) return setPhoto({ file, preview, status: "gagal", message: result.error.message });
    setImageUrl(result.data.public_url);
    setPhoto({ file, preview, status: "selesai" });
  }
  /** Memilih foto baru: lepas pratinjau lama lalu mulai unggah. */
  function selectPhoto(file: File) {
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhotoError(null);
    setServerErrors({});
    void upload(file, URL.createObjectURL(file));
  }
  /** Menghapus foto utama; unggahan yang masih berjalan diabaikan. */
  function removePhoto() {
    uploadToken.current++;
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setImageUrl(null);
    setPhotoError(null);
    setServerErrors({});
  }

  /** Mengirim formulir ke server lalu kembali ke /menu bila berhasil. */
  async function submit(event: React.FormEvent) {
    // 1. Masih ada galat: tampilkan ringkasan dan pindahkan fokus ke sana.
    event.preventDefault();
    if (Object.keys(clientErrors).length > 0) {
      setSubmitAttempted(true);
      setFocusKey((count) => count + 1);
      return;
    }
    // 2. Kirim sekali saja.
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => save(menu?.id ?? null, input));
    // 3. Gagal: galat per isian dari server dipetakan ke isian dan ringkasan; galat umum menjadi toast.
    if ("error" in result) {
      setSaving(false); // saat sukses tombol tetap "Menyimpan…" sampai halaman berpindah
      if (result.error.fields) {
        setServerErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
        setSubmitAttempted(true);
        setFocusKey((count) => count + 1);
      } else {
        toast({ tone: "danger", message: result.error.message });
      }
      return;
    }
    // 4. Berhasil: matikan penjaga perubahan, beri tahu, lalu pindah ke katalog.
    setSaved(true);
    toast({ tone: "success", message: "Menu disimpan" });
    router.push(doneHref);
  }

  // Unggahan gagal: tetap tampilkan foto tersimpan, bukan foto baru.
  const displayedPhoto = photo && photo.status !== "gagal" ? photo.preview : imageUrl;
  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <ErrorSummary errors={summaryErrors} focusKey={focusKey} />

          <FormSection title="Info dasar">
            <Field label="Nama menu" id="mf-name" required error={errorFor("name")}>
              <Input
                value={values.name}
                maxLength={80}
                onChange={(event) => setField("name", event.target.value)}
                onBlur={blur("name")}
              />
            </Field>
            <Field label="Kategori" id="mf-category_id" required error={errorFor("category_id")}>
              <Select
                value={values.category_id}
                onChange={(event) => setField("category_id", event.target.value)}
                onBlur={blur("category_id")}
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Deskripsi"
              id="mf-description"
              help={`Sebut bahan, rasa, dan porsi (mis. pedas, tanpa daging). Dipakai pencarian dan rekomendasi AI pembeli; 160 karakter pertama paling berpengaruh. ${values.description.length}/500 karakter`}
              error={errorFor("description")}
            >
              <Textarea
                value={values.description}
                onChange={(event) => setField("description", event.target.value)}
                onBlur={blur("description")}
              />
            </Field>
            <Field
              label="Satuan"
              id="mf-unit_label"
              required
              help="Contoh: porsi, box, isi 5"
              error={errorFor("unit_label")}
            >
              <Input
                value={values.unit_label}
                maxLength={30}
                onChange={(event) => setField("unit_label", event.target.value)}
                onBlur={blur("unit_label")}
              />
            </Field>
          </FormSection>

          <FormSection title="Foto">
            <MenuPhotoField
              displayedPhoto={displayedPhoto}
              photo={photo}
              imageError={errorFor("image_url")}
              photoError={photoError}
              canUploadPhoto={canUploadPhoto}
              onRetry={() => void upload(photo!.file, photo!.preview)}
              onSelect={selectPhoto}
              onError={setPhotoError}
              onRemove={removePhoto}
            />
            {canUploadPhoto && <p className="mt-2 text-sm font-medium text-ink">Foto tambahan</p>}
            {canUploadPhoto && (
              <ExtraPhotos
                urls={gallery}
                onChange={(urls) => {
                  setServerErrors({});
                  setGallery(urls);
                }}
                onBusy={setGalleryUploading}
                error={errorFor("gallery")}
              />
            )}
          </FormSection>

          <FormSection title="Harga">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="HPP (Rp)"
                id="mf-hpp"
                required
                help="Modal per porsi. Tidak terlihat pembeli."
                error={errorFor("hpp")}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={values.hpp}
                  onChange={(event) => setField("hpp", event.target.value)}
                  onBlur={blur("hpp")}
                />
              </Field>
              <Field label="Harga jual (Rp)" id="mf-price" required error={errorFor("price")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step={1}
                  value={values.price}
                  onChange={(event) => setField("price", event.target.value)}
                  onBlur={blur("price")}
                />
              </Field>
            </div>
            {margin !== null && price > hpp && (
              <div className="flex flex-col gap-1">
                <p className="text-ink">
                  Laba per porsi <span className="font-mono font-semibold">{formatRupiah(price - hpp)}</span> · Margin{" "}
                  {margin}%
                </p>
                {margin < 10 && (
                  <p
                    role="status"
                    className="flex items-center gap-2 rounded-md bg-warning-bg p-2 text-sm text-warning"
                  >
                    <TriangleAlert aria-hidden className="size-4" />
                    Margin tipis. Pertimbangkan menaikkan harga jual.
                  </p>
                )}
              </div>
            )}
          </FormSection>

          <FormSection title="Stok & waktu">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Kuota harian" id="mf-daily_quota" required error={errorFor("daily_quota")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={values.daily_quota}
                  onChange={(event) => setField("daily_quota", event.target.value)}
                  onBlur={blur("daily_quota")}
                />
              </Field>
              <Field label="Estimasi siap (menit)" id="mf-prep_minutes" required error={errorFor("prep_minutes")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={values.prep_minutes}
                  onChange={(event) => setField("prep_minutes", event.target.value)}
                  onBlur={blur("prep_minutes")}
                />
              </Field>
              <Field label="Minimum pesan" id="mf-min_order_qty" required error={errorFor("min_order_qty")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={values.min_order_qty}
                  onChange={(event) => setField("min_order_qty", event.target.value)}
                  onBlur={blur("min_order_qty")}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Pre-order">
            <div className="flex items-center gap-3">
              <Switch
                checked={values.is_preorder}
                onChange={(checked) => setField("is_preorder", checked)}
                label="Menu pre-order"
              />
              <span className="text-ink">Menu ini harus dipesan lebih dulu</span>
            </div>
            {values.is_preorder && (
              <div className="max-w-xs">
                <Field
                  label="Pesan H-… (hari sebelumnya)"
                  id="mf-preorder_days"
                  required
                  help="1 sampai 7 hari"
                  error={errorFor("preorder_days")}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={7}
                    step={1}
                    value={values.preorder_days}
                    onChange={(event) => setField("preorder_days", event.target.value)}
                    onBlur={blur("preorder_days")}
                  />
                </Field>
              </div>
            )}
          </FormSection>

          <FormSection title="Opsi tambahan">
            <OptionsEditor
              rows={values.options}
              errors={optionErrors}
              showAllErrors={submitAttempted}
              onChange={(rows) => setField("options", rows)}
            />
          </FormSection>

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={saving} loadingText="Menyimpan…" disabled={uploading}>
              Simpan menu
            </Button>
          </div>
        </form>

        <aside className="sticky top-6 hidden xl:block">
          <p className="mb-2 text-sm font-medium text-ink-muted">Pratinjau untuk pembeli</p>
          <MenuPreview
            name={values.name}
            price={Number.isFinite(price) ? price : null}
            unit={values.unit_label}
            category={categoryName}
            photo={displayedPhoto}
            options={input.options.map((option) => ({
              name: option.name,
              extra_price: Number.isFinite(option.extra_price) ? option.extra_price : 0,
            }))}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={guard.open}
        onClose={guard.cancel}
        title="Buang perubahan?"
        body="Perubahan pada menu ini belum disimpan."
        confirmLabel="Buang perubahan"
        cancelLabel="Tetap di sini"
        tone="danger"
        onConfirm={guard.confirm}
      />
    </>
  );
}
