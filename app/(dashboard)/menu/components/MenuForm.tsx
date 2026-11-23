"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { saveMenu } from "@/app/actions/menus";
import { callAction } from "@/lib/action";
import { uploadPhoto } from "@/lib/upload";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { ErrorSummary } from "@/app/components/ui/ErrorSummary";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Select, Textarea } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { formatRupiah } from "@/lib/format";
import { marginPercent } from "@/lib/menu-filter";
import { validateFields, menuFormSchema } from "@/lib/schemas";
import type { Category } from "@/types/meta";
import type { MerchantMenu } from "@/types/menu";
import { ExtraPhotos } from "./ExtraPhotos";
import { MenuPreview } from "./MenuPreview";
import { OptionsEditor, type OptionRow } from "./OptionsEditor";

const MEGABYTE = 1024 * 1024;
const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));
const FIELD_LABELS: Record<string, string> = {
  image_url: "Foto",
  gallery: "Foto tambahan",
  name: "Nama menu",
  category_id: "Kategori",
  description: "Deskripsi",
  unit_label: "Satuan",
  price: "Harga jual",
  hpp: "HPP",
  daily_quota: "Kuota harian",
  prep_minutes: "Estimasi siap",
  min_order_qty: "Minimum pesan",
  preorder_days: "Hari pre-order",
};
const fieldLabel = (fieldKey: string) => {
  const match = /^options\.(\d+)\./.exec(fieldKey);
  return match ? `Opsi ${Number(match[1]) + 1}` : (FIELD_LABELS[fieldKey] ?? fieldKey);
};

type FormValues = {
  name: string;
  category_id: string;
  description: string;
  unit_label: string;
  price: string;
  hpp: string;
  daily_quota: string;
  prep_minutes: string;
  is_preorder: boolean;
  preorder_days: string;
  min_order_qty: string;
  options: OptionRow[];
};
type PhotoUpload = { file: File; preview: string; status: "mengunggah" | "gagal" | "selesai"; message?: string };

// Tanda UI (t) tidak dihitung sebagai perubahan.
const serialize = (values: FormValues) =>
  JSON.stringify({ ...values, options: values.options.map((option) => [option.name, option.extra_price]) });

const initialValues = (
  menu: MerchantMenu | undefined,
  prefill: { hpp?: number; price?: number } | undefined,
): FormValues => ({
  name: menu?.name ?? "",
  category_id: menu ? String(menu.category.id) : "",
  description: menu?.description ?? "",
  unit_label: menu?.unit_label ?? "porsi",
  price: String(menu?.price ?? prefill?.price ?? ""),
  hpp: String(menu?.hpp ?? prefill?.hpp ?? ""),
  daily_quota: String(menu?.daily_quota ?? 20),
  prep_minutes: String(menu?.prep_minutes ?? 15),
  is_preorder: menu?.is_preorder ?? false,
  preorder_days: String(menu?.is_preorder ? menu.preorder_days : 1),
  min_order_qty: String(menu?.min_order_qty ?? 1),
  options: (menu?.options ?? []).map((option, index) => ({
    id: index,
    name: option.name,
    extra_price: String(option.extra_price),
    touched: false,
  })),
});

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** M-07, MF-*: form tambah/ubah menu. `menu` ada = mode ubah. */
export function MenuForm({
  categories,
  menu,
  prefill,
}: {
  categories: Category[];
  menu?: MerchantMenu;
  prefill?: { hpp?: number; price?: number };
}) {
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
  const uploadToken = useRef(0); // token unggahan terbaru; respons lama diabaikan
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

  const dirty =
    serialize(values) !== initialSnapshot ||
    (photo !== null && photo.status !== "gagal") ||
    imageUrl !== (menu?.image_url ?? null) ||
    JSON.stringify(gallery) !== JSON.stringify(menu?.gallery ?? []);
  const guard = useUnsavedGuard(dirty && !saved);

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setServerErrors({});
    setValues((previous) => ({ ...previous, [field]: value }));
  };
  const touch = (field: string) => setTouched((previous) => new Set(previous).add(field));
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

  const price = toNumber(values.price),
    hpp = toNumber(values.hpp);
  const canCalculate = Number.isFinite(price) && Number.isFinite(hpp) && price > 0;
  const margin = canCalculate ? marginPercent({ price, hpp }) : null;
  const categoryName = categories.find((category) => String(category.id) === values.category_id)?.name ?? "";
  const uploading = photo?.status === "mengunggah" || galleryUploading;

  async function upload(file: File, preview: string) {
    const token = ++uploadToken.current;
    setPhoto({ file, preview, status: "mengunggah" });
    const result = await uploadPhoto(file, "menu");
    if (token !== uploadToken.current) return;
    if ("error" in result) return setPhoto({ file, preview, status: "gagal", message: result.error.message }); // MF-E3
    setImageUrl(result.data.public_url);
    setPhoto({ file, preview, status: "selesai" });
  }
  function selectPhoto(file: File) {
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhotoError(null);
    setServerErrors({});
    void upload(file, URL.createObjectURL(file));
  }
  function removePhoto() {
    uploadToken.current++;
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setImageUrl(null);
    setPhotoError(null);
    setServerErrors({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(clientErrors).length > 0) {
      setSubmitAttempted(true);
      setFocusKey((count) => count + 1);
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await callAction(() => saveMenu(menu?.id ?? null, input));
    if ("error" in result) {
      setSaving(false); // sukses: tetap "Menyimpan…" sampai halaman berpindah
      if (result.error.fields) {
        // MF-E4
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
    setSaved(true);
    toast({ tone: "success", message: "Menu disimpan" });
    router.push("/menu");
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
            {displayedPhoto && (
              <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-md bg-subtle">
                <Image
                  src={displayedPhoto}
                  alt="Pratinjau foto menu"
                  fill
                  unoptimized
                  sizes="384px"
                  className="object-cover"
                />
              </div>
            )}
            {photo?.status === "mengunggah" && (
              <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
                Mengunggah foto…
              </p>
            )}
            {photo?.status === "gagal" && (
              <div
                role="alert"
                className="flex flex-wrap items-center gap-3 rounded-md border border-danger bg-danger-bg p-3 text-danger"
              >
                <p className="flex items-center gap-2">
                  <TriangleAlert aria-hidden className="size-5" />
                  {photo.message ?? "Foto gagal diunggah. Coba lagi"}
                </p>
                <Button variant="secondary" onClick={() => void upload(photo.file, photo.preview)}>
                  Coba unggah lagi
                </Button>
              </div>
            )}
            {errorFor("image_url") && (
              <p className="flex items-center gap-2 text-sm text-danger">
                <TriangleAlert aria-hidden className="size-4" />
                {errorFor("image_url")}
              </p>
            )}
            {photoError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-danger">
                <TriangleAlert aria-hidden className="size-4" />
                {photoError}
              </p>
            )}
            {/* foto HP besar diperkecil di lib/upload.ts sebelum diunggah (batas backend 5 MB) */}
            <FileDrop
              id="mf-image_url"
              maxBytes={20 * MEGABYTE}
              onFile={selectPhoto}
              onError={setPhotoError}
              label={displayedPhoto ? "Ganti foto" : "Pilih foto"}
            />
            {displayedPhoto && (
              <div>
                <Button variant="ghost" onClick={removePhoto}>
                  <X aria-hidden className="size-4" />
                  Hapus foto
                </Button>
              </div>
            )}
            <p className="mt-2 text-sm font-medium text-ink">Foto tambahan</p>
            <ExtraPhotos
              urls={gallery}
              onChange={(urls) => {
                setServerErrors({});
                setGallery(urls);
              }}
              onBusy={setGalleryUploading}
              error={errorFor("gallery")}
            />
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
