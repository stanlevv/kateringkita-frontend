// Komponen PopupList: isi halaman /admin/popup. Tombol "Buat pop-up" (formulir di dialog: judul, gambar, voucher
// platform opsional, masa tayang, aktif) dan kartu setiap pop-up dengan statusnya serta tombol ubah (dialog yang sama,
// terisi), nonaktifkan/aktifkan, dan arsipkan. Di tampilan Arsip, kartu hanya punya tombol pulihkan.
// Simpan lewat server action savePopup dan setPopupArchived (app/actions/admin/popup.ts); gambar diunggah langsung dari
// peramban (lib/upload.ts) dengan alamat unggah dari requestAdminUpload. Data pop-up dan voucher diambil page.tsx.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, dialog, dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, EyeOff, Megaphone, Plus, type LucideIcon } from "lucide-react";
import { requestAdminUpload } from "@/app/actions/admin/banner";
import { savePopup, setPopupArchived } from "@/app/actions/admin/popup";
import { Badge } from "@/app/components/ui/Badge";
import { Banner as AlertBanner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { FileDrop } from "@/app/components/ui/FileDrop";
import { Input, Select } from "@/app/components/ui/Input";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatDate, wibInputToIso, isoToWibInput } from "@/lib/format";
import type { Tone } from "@/lib/order-status";
import { uploadPhoto } from "@/lib/upload";
import { withCurrentVoucher } from "@/lib/voucher-options";
import type { VoucherOption } from "@/types/banner";
import type { Popup } from "@/types/popup";

/**
 * Menentukan status tayang pop-up pada waktu tertentu: Nonaktif, Berakhir, Terjadwal (belum mulai), atau Tayang.
 * @param popup data pop-up
 * @param now waktu sekarang dalam milidetik
 * @returns label status, nada warna, dan ikon
 */
export function popupStatus(popup: Popup, now: number): { label: string; tone: Tone; icon: LucideIcon } {
  if (!popup.is_active) return { label: "Nonaktif", tone: "neutral", icon: EyeOff };
  if (Date.parse(popup.ends_at) <= now) return { label: "Berakhir", tone: "neutral", icon: EyeOff };
  if (Date.parse(popup.starts_at) > now) return { label: "Terjadwal", tone: "info", icon: CalendarClock };
  return { label: "Tayang", tone: "success", icon: CheckCircle2 };
}

/**
 * Formulir pop-up baru atau pop-up yang diubah (terisi dari `popup`). Masa tayang bawaan pop-up baru: sekarang sampai
 * 7 hari lagi; jam diisi dan ditampilkan dalam WIB.
 * @param props.popup pop-up yang diubah; kosong = pop-up baru
 * @param props.vouchers voucher platform yang bisa ditautkan
 * @param props.onSaved dipanggil setelah pop-up tersimpan
 * @param props.onClose dipanggil saat tombol Batal ditekan
 * @returns form
 */
function PopupForm({
  popup,
  vouchers,
  onSaved,
  onClose,
}: {
  popup?: Popup | null;
  vouchers: VoucherOption[];
  onSaved: () => void;
  onClose: () => void;
}) {
  // 1. State isian, galat per isian, galat umum (tanpa isian), dan tanda sedang mengirim.
  const [title, setTitle] = useState(popup?.title ?? "");
  const [image, setImage] = useState(popup?.image_url ?? "");
  const [promoId, setPromoId] = useState(popup?.promo ? String(popup.promo.id) : "");
  const [starts, setStarts] = useState(() => isoToWibInput(popup?.starts_at ?? new Date().toISOString()));
  const [ends, setEnds] = useState(() =>
    isoToWibInput(popup?.ends_at ?? new Date(Date.now() + 7 * 86400e3).toISOString()),
  );
  const [active, setActive] = useState(popup?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // 2. Unggah gambar begitu dipilih; alamat publiknya disimpan untuk pratinjau dan dikirim saat simpan.
  async function uploadImage(file: File) {
    const result = await uploadPhoto(file, "popup", requestAdminUpload);
    if ("error" in result) return setErrors((previous) => ({ ...previous, image_url: result.error.message }));
    setImage(result.data.public_url);
  }

  // 3. Simpan pop-up baru (id null) atau pop-up yang diubah.
  async function submit(event: React.FormEvent) {
    // 1. Cegah kirim ganda, lalu kirim isian; jam WIB dari isian diubah ke waktu ISO.
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await callAction(() =>
      savePopup(popup?.id ?? null, {
        title: title.trim(),
        image_url: image,
        promo_id: promoId ? Number(promoId) : null,
        starts_at: wibInputToIso(starts),
        ends_at: wibInputToIso(ends),
        is_active: active,
      }),
    );
    setBusy(false);
    // 2. Gagal: galat per isian tampil di bawah isiannya; galat lain tampil di atas formulir.
    if ("error" in result) {
      if (result.error.fields)
        setErrors(
          Object.fromEntries(Object.entries(result.error.fields).map(([field, messages]) => [field, messages[0]])),
        );
      else setGeneralError(result.error.message);
      return;
    }
    // 3. Berhasil: serahkan ke pemanggil (tutup dialog, toast, muat ulang).
    onSaved();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {generalError && <AlertBanner tone="danger">{generalError}</AlertBanner>}
      <Field label="Judul" id="pp-title" required error={errors.title}>
        <Input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <Field label="Gambar pop-up" id="pp-image" required help="Rasio 3:4 (mis. 900×1200 px)." error={errors.image_url}>
        <FileDrop
          id="pp-image"
          maxBytes={20 * 1024 * 1024}
          onFile={uploadImage}
          onError={(message) => setErrors((previous) => ({ ...previous, image_url: message }))}
          label={image ? "Ganti gambar" : "Pilih gambar"}
        />
      </Field>
      {image && (
        <div className="mx-auto w-48 rounded-[1.5rem] border-4 border-ink/80 bg-ink/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau dalam bingkai ponsel, dari penyimpanan publik */}
          <img src={image} alt="Pratinjau pop-up" className="aspect-[3/4] w-full rounded-lg object-cover" />
        </div>
      )}
      <Field
        label="Voucher platform (opsional)"
        id="pp-promo"
        error={errors.promo_id}
        help="Pembeli bisa langsung mengklaimnya dari pop-up."
      >
        <Select value={promoId} onChange={(event) => setPromoId(event.target.value)}>
          <option value="">Tanpa voucher</option>
          {withCurrentVoucher(vouchers, popup?.promo ?? null).map((voucher) => (
            <option key={voucher.id} value={voucher.id}>
              {voucher.code} — {voucher.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="pp-starts" required error={errors.starts_at}>
          <Input type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} />
        </Field>
        <Field label="Selesai (WIB)" id="pp-ends" required error={errors.ends_at}>
          <Input type="datetime-local" value={ends} onChange={(event) => setEnds(event.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={active} onChange={setActive} label="Pop-up aktif" />
        <span className="text-ink">Pop-up aktif</span>
      </div>
      <p className="text-sm text-ink-muted">
        Yang tayang di aplikasi: pop-up aktif terbaru dalam periodenya, sekali sehari per pembeli.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={busy} loadingText="Menyimpan…">
          Simpan pop-up
        </Button>
      </div>
    </form>
  );
}

/**
 * Pop-up promo aplikasi mobile: daftar + status, buat baru, ubah, nonaktifkan / aktifkan, arsipkan, dan pulihkan.
 * Support hanya melihat.
 * @param props.popups pop-up dari backend (yang tidak diarsipkan, atau yang diarsipkan di tampilan Arsip)
 * @param props.vouchers voucher platform yang bisa ditautkan ke pop-up
 * @param props.canEdit true bila admin boleh membuat dan mengubah pop-up (super dan ops)
 * @param props.archived true di tampilan Arsip: tanpa tombol buat, ubah, dan arsip; hanya pulihkan
 * @returns tombol buat, kartu pop-up, dialog PopupForm, dan dialog konfirmasi arsip
 */
export function PopupList({
  popups,
  vouchers,
  canEdit,
  archived = false,
}: {
  popups: Popup[];
  vouchers: VoucherOption[];
  canEdit: boolean;
  archived?: boolean;
}) {
  // 1. State dialog formulir ("new" = pop-up baru), pop-up yang menunggu konfirmasi arsip, tanda arsip/pulihkan sedang
  //    dikirim (mencegah klik ganda), dan waktu acuan status.
  const router = useRouter();
  const [form, setForm] = useState<"new" | Popup | null>(null);
  const [popupToArchive, setPopupToArchive] = useState<Popup | null>(null);
  const [archiving, setArchiving] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- status tayang dihitung saat render
  const now = Date.now();

  // 2. Nonaktifkan/aktifkan satu pop-up (PATCH is_active), lalu muat ulang data halaman.
  async function togglePopupActive(popup: Popup, active: boolean) {
    const result = await callAction(() => savePopup(popup.id, { is_active: active }));
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: active ? "Pop-up diaktifkan." : "Pop-up dinonaktifkan." });
    router.refresh();
  }

  // 3. Arsipkan atau pulihkan satu pop-up; pesan penolakan backend (mis. 409) tampil apa adanya.
  async function setPopupArchive(popup: Popup, archive: boolean) {
    setArchiving(true);
    const result = await callAction(() => setPopupArchived(popup.id, archive));
    setArchiving(false);
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: archive ? "Pop-up diarsipkan." : "Pop-up dipulihkan." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && !archived && (
        <div>
          <Button onClick={() => setForm("new")}>
            <Plus aria-hidden className="size-4" />
            Buat pop-up
          </Button>
        </div>
      )}
      {popups.length === 0 ? (
        archived ? (
          <EmptyState
            icon={Megaphone}
            title="Belum ada pop-up yang diarsipkan"
            body="Pop-up yang diarsipkan muncul di sini dan bisa dipulihkan."
          />
        ) : (
          <EmptyState
            icon={Megaphone}
            title="Belum ada pop-up"
            body="Pop-up tampil saat aplikasi pembeli dibuka, sekali sehari."
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {popups.map((popup) => {
            const statusView = popupStatus(popup, now);
            return (
              <li key={popup.id}>
                <article
                  aria-label={popup.title}
                  className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
                  <img src={popup.image_url} alt="" className="mx-auto aspect-[3/4] w-40 rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{popup.title}</p>
                    <Badge tone={statusView.tone} icon={statusView.icon}>
                      {statusView.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {popup.promo ? `Voucher ${popup.promo.code}` : "Tanpa voucher"} · {formatDate(popup.starts_at)} –{" "}
                    {formatDate(popup.ends_at)}
                  </p>
                  {canEdit && (
                    <div className="mt-auto flex flex-wrap justify-end gap-2">
                      {archived ? (
                        <Button
                          variant="secondary"
                          disabled={archiving}
                          onClick={() => void setPopupArchive(popup, false)}
                        >
                          Pulihkan
                        </Button>
                      ) : (
                        <>
                          <Button variant="secondary" onClick={() => setForm(popup)}>
                            Ubah
                          </Button>
                          <Button variant="secondary" onClick={() => void togglePopupActive(popup, !popup.is_active)}>
                            {popup.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button variant="secondary" disabled={archiving} onClick={() => setPopupToArchive(popup)}>
                            Arsipkan
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form === "new" ? "Buat pop-up" : "Ubah pop-up"}
        className="max-h-[90dvh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {form !== null && (
          <PopupForm
            popup={form === "new" ? null : form}
            vouchers={vouchers}
            onClose={() => setForm(null)}
            onSaved={() => {
              setForm(null);
              toast({ tone: "success", message: "Pop-up disimpan." });
              router.refresh();
            }}
          />
        )}
      </Dialog>
      <ConfirmDialog
        open={!!popupToArchive}
        onClose={() => setPopupToArchive(null)}
        tone="danger"
        title="Arsipkan pop-up?"
        body={`"${popupToArchive?.title ?? ""}" berhenti tampil di aplikasi pembeli. Pop-up bisa dipulihkan dari tampilan Arsip.`}
        confirmLabel="Ya, arsipkan"
        onConfirm={() => {
          const popup = popupToArchive!;
          setPopupToArchive(null);
          void setPopupArchive(popup, true);
        }}
      />
    </div>
  );
}
