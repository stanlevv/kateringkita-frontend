"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, EyeOff, Megaphone, Plus, type LucideIcon } from "lucide-react";
import { mintaUnggahAdmin } from "@/app/actions/admin/banner";
import { simpanPopup } from "@/app/actions/admin/popup";
import { Badge } from "@/app/components/ui/Badge";
import { Banner as Peringatan } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
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
import type { VoucherOption } from "@/types/banner";
import type { Popup } from "@/types/popup";

export function statusPopup(p: Popup, now: number): { label: string; tone: Tone; icon: LucideIcon } {
  if (!p.is_active) return { label: "Nonaktif", tone: "neutral", icon: EyeOff };
  if (Date.parse(p.ends_at) <= now) return { label: "Berakhir", tone: "neutral", icon: EyeOff };
  if (Date.parse(p.starts_at) > now) return { label: "Terjadwal", tone: "info", icon: CalendarClock };
  return { label: "Tayang", tone: "success", icon: CheckCircle2 };
}

function PopupForm({
  vouchers,
  onSaved,
  onClose,
}: {
  vouchers: VoucherOption[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [promoId, setPromoId] = useState("");
  const [starts, setStarts] = useState(() => isoToWibInput(new Date().toISOString()));
  const [ends, setEnds] = useState(() => isoToWibInput(new Date(Date.now() + 7 * 86400e3).toISOString()));
  const [aktif, setAktif] = useState(true);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [umum, setUmum] = useState<string>();
  const [sibuk, setSibuk] = useState(false);

  async function pilihGambar(f: File) {
    const r = await uploadPhoto(f, "popup", mintaUnggahAdmin);
    if ("error" in r) return setGalat((g) => ({ ...g, image_url: r.error.message }));
    setImage(r.data.public_url);
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    const r = await callAction(() =>
      simpanPopup(null, {
        title: title.trim(),
        image_url: image,
        promo_id: promoId ? Number(promoId) : null,
        starts_at: wibInputToIso(starts),
        ends_at: wibInputToIso(ends),
        is_active: aktif,
      }),
    );
    setSibuk(false);
    if ("error" in r) {
      if (r.error.fields) setGalat(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]])));
      else setUmum(r.error.message);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      {umum && <Peringatan tone="danger">{umum}</Peringatan>}
      <Field label="Judul" id="pp-title" required error={galat.title}>
        <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Gambar pop-up" id="pp-image" required help="Rasio 3:4 (mis. 900×1200 px)." error={galat.image_url}>
        <FileDrop
          id="pp-image"
          maxBytes={20 * 1024 * 1024}
          onFile={pilihGambar}
          onError={(m) => setGalat((g) => ({ ...g, image_url: m }))}
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
        error={galat.promo_id}
        help="Pembeli bisa langsung mengklaimnya dari pop-up."
      >
        <Select value={promoId} onChange={(e) => setPromoId(e.target.value)}>
          <option value="">Tanpa voucher</option>
          {vouchers.map((v) => (
            <option key={v.id} value={v.id}>
              {v.code} — {v.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" id="pp-starts" required error={galat.starts_at}>
          <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
        </Field>
        <Field label="Selesai (WIB)" id="pp-ends" required error={galat.ends_at}>
          <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={aktif} onChange={setAktif} label="Pop-up aktif" />
        <span className="text-ink">Pop-up aktif</span>
      </div>
      <p className="text-sm text-ink-muted">
        Yang tayang di aplikasi: pop-up aktif terbaru dalam periodenya, sekali sehari per pembeli.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" loading={sibuk} loadingText="Menyimpan…">
          Simpan pop-up
        </Button>
      </div>
    </form>
  );
}

/** Pop-up promo aplikasi mobile: daftar + status, buat baru, nonaktifkan / aktifkan. Support hanya melihat. */
export function DaftarPopup({
  popups,
  vouchers,
  bolehUbah,
}: {
  popups: Popup[];
  vouchers: VoucherOption[];
  bolehUbah: boolean;
}) {
  const router = useRouter();
  const [buat, setBuat] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- status tayang dihitung saat render
  const now = Date.now();

  async function setAktif(p: Popup, aktif: boolean) {
    const r = await callAction(() => simpanPopup(p.id, { is_active: aktif }));
    if ("error" in r) return toast({ tone: "danger", message: r.error.message });
    toast({ tone: "success", message: aktif ? "Pop-up diaktifkan." : "Pop-up dinonaktifkan." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {bolehUbah && (
        <div>
          <Button onClick={() => setBuat(true)}>
            <Plus aria-hidden className="size-4" />
            Buat pop-up
          </Button>
        </div>
      )}
      {popups.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum ada pop-up"
          body="Pop-up tampil saat aplikasi pembeli dibuka, sekali sehari."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {popups.map((p) => {
            const st = statusPopup(p, now);
            return (
              <li key={p.id}>
                <article
                  aria-label={p.title}
                  className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
                  <img src={p.image_url} alt="" className="mx-auto aspect-[3/4] w-40 rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{p.title}</p>
                    <Badge tone={st.tone} icon={st.icon}>
                      {st.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {p.promo ? `Voucher ${p.promo.code}` : "Tanpa voucher"} · {formatDate(p.starts_at)} –{" "}
                    {formatDate(p.ends_at)}
                  </p>
                  {bolehUbah && (
                    <div className="mt-auto flex justify-end">
                      <Button variant="secondary" onClick={() => void setAktif(p, !p.is_active)}>
                        {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog
        open={buat}
        onClose={() => setBuat(false)}
        title="Buat pop-up"
        className="max-h-[90dvh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {buat && (
          <PopupForm
            vouchers={vouchers}
            onClose={() => setBuat(false)}
            onSaved={() => {
              setBuat(false);
              toast({ tone: "success", message: "Pop-up disimpan." });
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
