"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { saveMenu } from "@/app/actions/menus";
import { panggil } from "@/lib/aksi";
import { unggahFoto } from "@/lib/unggah";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Field } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";
import { useUnsavedGuard } from "@/components/ui/useUnsavedGuard";
import { formatRupiah } from "@/lib/format";
import { marginPersen } from "@/lib/menu-filter";
import { cekField, menuFormSchema } from "@/lib/schemas";
import type { Category, MerchantMenu } from "@/lib/types";
import { MenuPreview } from "./MenuPreview";
import { OptionsEditor, type BarisOpsi } from "./OptionsEditor";

const MB = 1024 * 1024;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const LABEL: Record<string, string> = {
  image_url: "Foto", name: "Nama menu", category_id: "Kategori", description: "Deskripsi", unit_label: "Satuan", price: "Harga jual", hpp: "HPP",
  daily_quota: "Kuota harian", prep_minutes: "Estimasi siap", min_order_qty: "Minimum pesan", preorder_days: "Hari pre-order",
};
const labelKey = (k: string) => {
  const m = /^options\.(\d+)\./.exec(k);
  return m ? `Opsi ${Number(m[1]) + 1}` : (LABEL[k] ?? k);
};

type Isian = {
  name: string; category_id: string; description: string; unit_label: string; price: string; hpp: string; daily_quota: string;
  prep_minutes: string; is_preorder: boolean; preorder_days: string; min_order_qty: string; options: BarisOpsi[];
};
type Foto = { file: File; preview: string; status: "mengunggah" | "gagal" | "selesai"; pesan?: string };

// Tanda UI (t) tidak dihitung sebagai perubahan.
const kunci = (i: Isian) => JSON.stringify({ ...i, options: i.options.map((o) => [o.name, o.extra_price]) });

const awalDari = (m: MerchantMenu | undefined, prefill: { hpp?: number; price?: number } | undefined): Isian => ({
  name: m?.name ?? "",
  category_id: m ? String(m.category.id) : "",
  description: m?.description ?? "",
  unit_label: m?.unit_label ?? "porsi",
  price: String(m?.price ?? prefill?.price ?? ""),
  hpp: String(m?.hpp ?? prefill?.hpp ?? ""),
  daily_quota: String(m?.daily_quota ?? 20),
  prep_minutes: String(m?.prep_minutes ?? 15),
  is_preorder: m?.is_preorder ?? false,
  preorder_days: String(m?.is_preorder ? m.preorder_days : 1),
  min_order_qty: String(m?.min_order_qty ?? 1),
  options: (m?.options ?? []).map((o, k) => ({ k, name: o.name, extra_price: String(o.extra_price), t: false })),
});

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section aria-label={judul} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{judul}</h2>
      {children}
    </section>
  );
}

/** M-07, MF-*: form tambah/ubah menu. `menu` ada = mode ubah. */
export function MenuForm({ categories, menu, prefill }: { categories: Category[]; menu?: MerchantMenu; prefill?: { hpp?: number; price?: number } }) {
  const router = useRouter();
  const [awal] = useState(() => kunci(awalDari(menu, prefill)));
  const [v, setV] = useState<Isian>(() => awalDari(menu, prefill));
  const [imageUrl, setImageUrl] = useState<string | null>(menu?.image_url ?? null);
  const [foto, setFoto] = useState<Foto | null>(null);
  const [fotoGalat, setFotoGalat] = useState<string | null>(null);
  const [tersentuh, setTersentuh] = useState<Set<string>>(new Set());
  const [dicoba, setDicoba] = useState(false);
  const [fokusKey, setFokusKey] = useState(0);
  const [server, setServer] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const unggahKe = useRef(0); // token unggahan terbaru; respons lama diabaikan
  const fotoRef = useRef(foto);
  useEffect(() => { fotoRef.current = foto; });
  useEffect(() => () => { if (fotoRef.current) URL.revokeObjectURL(fotoRef.current.preview); }, []);

  const dirty = kunci(v) !== awal || (foto !== null && foto.status !== "gagal") || imageUrl !== (menu?.image_url ?? null);
  const guard = useUnsavedGuard(dirty && !tersimpan);

  const set = <K extends keyof Isian>(k: K, nilai: Isian[K]) => { setServer({}); setV((p) => ({ ...p, [k]: nilai })); };
  const sentuh = (k: string) => setTersentuh((p) => new Set(p).add(k));
  const input = {
    name: v.name, category_id: num(v.category_id), description: v.description, image_url: imageUrl, unit_label: v.unit_label,
    price: num(v.price), hpp: num(v.hpp), daily_quota: num(v.daily_quota), prep_minutes: num(v.prep_minutes),
    is_preorder: v.is_preorder, preorder_days: v.is_preorder ? num(v.preorder_days) : 0, min_order_qty: num(v.min_order_qty),
    options: v.options.map((o) => ({ name: o.name, extra_price: num(o.extra_price) })),
  };
  const semua = cekField(menuFormSchema, input);
  const galatSemua = dicoba ? { ...server, ...semua } : semua;
  const galat = (k: string) => (dicoba || tersentuh.has(k) ? galatSemua[k] : undefined);
  const galatOpsi = dicoba ? galatSemua : Object.fromEntries(Object.entries(galatSemua).filter(([k]) => k.startsWith("options.")));
  const ringkasan = dicoba ? Object.entries(galatSemua).map(([k, m]) => ({ id: `mf-${k.replace(/\./g, "-")}`, message: `${labelKey(k)}: ${m}` })) : [];
  const blur = (k: string) => () => sentuh(k);

  const price = num(v.price), hpp = num(v.hpp);
  const hitungOk = Number.isFinite(price) && Number.isFinite(hpp) && price > 0;
  const margin = hitungOk ? marginPersen({ price, hpp }) : null;
  const namaKategori = categories.find((c) => String(c.id) === v.category_id)?.name ?? "";
  const uploading = foto?.status === "mengunggah";

  async function unggah(file: File, preview: string) {
    const id = ++unggahKe.current;
    setFoto({ file, preview, status: "mengunggah" });
    const r = await unggahFoto(file, "menu");
    if (id !== unggahKe.current) return;
    if ("error" in r) return setFoto({ file, preview, status: "gagal", pesan: r.error.message }); // MF-E3
    setImageUrl(r.data.public_url);
    setFoto({ file, preview, status: "selesai" });
  }
  function pilihFoto(file: File) {
    if (foto) URL.revokeObjectURL(foto.preview);
    setFotoGalat(null);
    setServer({});
    void unggah(file, URL.createObjectURL(file));
  }
  function hapusFoto() {
    unggahKe.current++;
    if (foto) URL.revokeObjectURL(foto.preview);
    setFoto(null);
    setImageUrl(null);
    setFotoGalat(null);
    setServer({});
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(semua).length > 0) {
      setDicoba(true);
      setFokusKey((n) => n + 1);
      return;
    }
    if (menyimpan) return;
    setMenyimpan(true);
    const r = await panggil(() => saveMenu(menu?.id ?? null, input));
    if ("error" in r) {
      setMenyimpan(false); // sukses: tetap "Menyimpan…" sampai halaman berpindah
      if (r.error.fields) { // MF-E4
        setServer(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
        setDicoba(true);
        setFokusKey((n) => n + 1);
      } else {
        toast({ tone: "danger", message: r.error.message });
      }
      return;
    }
    setTersimpan(true);
    toast({ tone: "success", message: "Menu disimpan" });
    router.push("/menu");
  }

  // Unggahan gagal: tetap tampilkan foto tersimpan, bukan foto baru.
  const tampilFoto = foto && foto.status !== "gagal" ? foto.preview : imageUrl;
  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={kirim} noValidate className="flex flex-col gap-6">
          <ErrorSummary errors={ringkasan} focusKey={fokusKey} />

          <Bagian judul="Info dasar">
            <Field label="Nama menu" id="mf-name" required error={galat("name")}>
              <Input value={v.name} maxLength={80} onChange={(e) => set("name", e.target.value)} onBlur={blur("name")} />
            </Field>
            <Field label="Kategori" id="mf-category_id" required error={galat("category_id")}>
              <Select value={v.category_id} onChange={(e) => set("category_id", e.target.value)} onBlur={blur("category_id")}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Deskripsi" id="mf-description" help={`${v.description.length}/500 karakter`} error={galat("description")}>
              <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} onBlur={blur("description")} />
            </Field>
            <Field label="Satuan" id="mf-unit_label" required help="Contoh: porsi, box, isi 5" error={galat("unit_label")}>
              <Input value={v.unit_label} maxLength={30} onChange={(e) => set("unit_label", e.target.value)} onBlur={blur("unit_label")} />
            </Field>
          </Bagian>

          <Bagian judul="Foto">
            {tampilFoto && (
              <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-md bg-subtle">
                <Image src={tampilFoto} alt="Pratinjau foto menu" fill unoptimized sizes="384px" className="object-cover" />
              </div>
            )}
            {uploading && (
              <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />Mengunggah foto…
              </p>
            )}
            {foto?.status === "gagal" && (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger bg-danger-bg p-3 text-danger">
                <p className="flex items-center gap-2"><TriangleAlert aria-hidden className="size-5" />{foto.pesan ?? "Foto gagal diunggah. Coba lagi"}</p>
                <Button variant="secondary" onClick={() => void unggah(foto.file, foto.preview)}>Coba unggah lagi</Button>
              </div>
            )}
            {galat("image_url") && <p className="flex items-center gap-2 text-sm text-danger"><TriangleAlert aria-hidden className="size-4" />{galat("image_url")}</p>}
            {fotoGalat && <p role="alert" className="flex items-center gap-2 text-sm text-danger"><TriangleAlert aria-hidden className="size-4" />{fotoGalat}</p>}
            <FileDrop id="mf-image_url" maxBytes={5 * MB} onFile={pilihFoto} onError={setFotoGalat} label={tampilFoto ? "Ganti foto" : "Pilih foto"} />
            {tampilFoto && <div><Button variant="ghost" onClick={hapusFoto}><X aria-hidden className="size-4" />Hapus foto</Button></div>}
          </Bagian>

          <Bagian judul="Harga">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="HPP (Rp)" id="mf-hpp" required help="Modal per porsi. Tidak terlihat pembeli." error={galat("hpp")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={v.hpp} onChange={(e) => set("hpp", e.target.value)} onBlur={blur("hpp")} />
              </Field>
              <Field label="Harga jual (Rp)" id="mf-price" required error={galat("price")}>
                <Input type="number" inputMode="numeric" min={1000} step={1} value={v.price} onChange={(e) => set("price", e.target.value)} onBlur={blur("price")} />
              </Field>
            </div>
            {margin !== null && price > hpp && (
              <div className="flex flex-col gap-1">
                <p className="text-ink">Laba per porsi <span className="font-mono font-semibold">{formatRupiah(price - hpp)}</span> · Margin {margin}%</p>
                {margin < 10 && (
                  <p role="status" className="flex items-center gap-2 rounded-md bg-warning-bg p-2 text-sm text-warning">
                    <TriangleAlert aria-hidden className="size-4" />Margin tipis. Pertimbangkan menaikkan harga jual.
                  </p>
                )}
              </div>
            )}
          </Bagian>

          <Bagian judul="Stok & waktu">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Kuota harian" id="mf-daily_quota" required error={galat("daily_quota")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={v.daily_quota} onChange={(e) => set("daily_quota", e.target.value)} onBlur={blur("daily_quota")} />
              </Field>
              <Field label="Estimasi siap (menit)" id="mf-prep_minutes" required error={galat("prep_minutes")}>
                <Input type="number" inputMode="numeric" min={1} step={1} value={v.prep_minutes} onChange={(e) => set("prep_minutes", e.target.value)} onBlur={blur("prep_minutes")} />
              </Field>
              <Field label="Minimum pesan" id="mf-min_order_qty" required error={galat("min_order_qty")}>
                <Input type="number" inputMode="numeric" min={1} step={1} value={v.min_order_qty} onChange={(e) => set("min_order_qty", e.target.value)} onBlur={blur("min_order_qty")} />
              </Field>
            </div>
          </Bagian>

          <Bagian judul="Pre-order">
            <div className="flex items-center gap-3">
              <Switch checked={v.is_preorder} onChange={(x) => set("is_preorder", x)} label="Menu pre-order" />
              <span className="text-ink">Menu ini harus dipesan lebih dulu</span>
            </div>
            {v.is_preorder && (
              <div className="max-w-xs">
                <Field label="Pesan H-… (hari sebelumnya)" id="mf-preorder_days" required help="1 sampai 7 hari" error={galat("preorder_days")}>
                  <Input type="number" inputMode="numeric" min={1} max={7} step={1} value={v.preorder_days} onChange={(e) => set("preorder_days", e.target.value)} onBlur={blur("preorder_days")} />
                </Field>
              </div>
            )}
          </Bagian>

          <Bagian judul="Opsi tambahan">
            <OptionsEditor rows={v.options} errors={galatOpsi} semua={dicoba} onChange={(rows) => set("options", rows)} />
          </Bagian>

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={menyimpan} loadingText="Menyimpan…" disabled={uploading}>Simpan menu</Button>
          </div>
        </form>

        <aside className="sticky top-6 hidden xl:block">
          <p className="mb-2 text-sm font-medium text-ink-muted">Pratinjau untuk pembeli</p>
          <MenuPreview name={v.name} price={Number.isFinite(price) ? price : null} unit={v.unit_label} category={namaKategori} photo={tampilFoto} options={input.options.map((o) => ({ name: o.name, extra_price: Number.isFinite(o.extra_price) ? o.extra_price : 0 }))} />
        </aside>
      </div>

      <ConfirmDialog open={guard.open} onClose={guard.cancel} title="Buang perubahan?" body="Perubahan pada menu ini belum disimpan." confirmLabel="Buang perubahan" cancelLabel="Tetap di sini" tone="danger" onConfirm={guard.confirm} />
    </>
  );
}
