// Komponen BannerAdmin: isi halaman /admin/banner. Tombol "Buat banner platform" (membuka BannerForm di dialog) dan
// kartu setiap banner: gambar, pemilik (toko atau platform), tujuan, masa tayang, status, tombol tinjau (setujui, tolak
// dengan alasan, nonaktifkan), tombol ubah (hanya banner platform, BannerForm terisi), dan tombol arsipkan. Di tampilan
// Arsip, kartu hanya punya tombol pulihkan. Server action ada di app/actions/admin/banner.ts: reviewAdminBanner,
// createAdminBanner, updateAdminBannerContent, dan setAdminBannerArchived. Data banner dan voucher diambil page.tsx.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, dialog, dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus } from "lucide-react";
import {
  createAdminBanner,
  requestAdminUpload,
  reviewAdminBanner,
  setAdminBannerArchived,
  updateAdminBannerContent,
} from "@/app/actions/admin/banner";
import { BannerForm } from "@/app/components/banner/BannerForm";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { bannerStatus } from "@/lib/banner";
import { formatDate } from "@/lib/format";
import { withCurrentVoucher } from "@/lib/voucher-options";
import type { Banner, VoucherOption } from "@/types/banner";

// Pesan galat bila alasan penolakan terlalu pendek.
const REASON_HINT = "Tulis alasan penolakan (3–300 karakter).";

/**
 * Kartu satu banner beserta tombol tinjaunya. Tombol yang muncul mengikuti status: menunggu -> tolak dan setujui;
 * ditolak atau nonaktif -> setujui; disetujui -> nonaktifkan. Banner platform juga punya tombol ubah, dan semua banner
 * punya tombol arsipkan. Di tampilan Arsip hanya ada tombol pulihkan.
 * @param props.banner banner dari backend
 * @param props.now waktu acuan untuk status tayang/terjadwal/berakhir
 * @param props.canEdit true bila admin boleh meninjau, mengubah, dan mengarsipkan (super dan ops)
 * @param props.archived true bila kartu tampil di tampilan Arsip
 * @param props.onEdit dipanggil saat tombol Ubah banner platform ditekan
 * @returns article
 */
function BannerCard({
  banner,
  now,
  canEdit,
  archived,
  onEdit,
}: {
  banner: Banner;
  now: number;
  canEdit: boolean;
  archived: boolean;
  onEdit: () => void;
}) {
  // 1. State alasan tolak, galat alasan, tanda sedang mengirim, serta dialog konfirmasi setujui dan arsipkan.
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const statusView = bannerStatus(banner, now);

  // 2. Kirim tinjauan; "disetujui"/"ditolak"/"nonaktif" adalah nilai yang diterima backend.
  async function review(status: "disetujui" | "ditolak" | "nonaktif") {
    // 1. Tolak wajib beralasan minimal 3 karakter; berhenti di sini dengan galat di isian alasan.
    if (status === "ditolak" && reason.trim().length < 3) return setErrorMessage(REASON_HINT);
    // 2. Panggil server action; alasan hanya dikirim saat menolak.
    setBusy(true);
    const result = await callAction(() =>
      reviewAdminBanner(banner.id, status === "ditolak" ? { status, catatan: reason.trim() } : { status }),
    );
    setBusy(false);
    // 3. Gagal: galat alasan dari backend tampil di isian, galat lain jadi toast.
    if ("error" in result) {
      if (result.error.fields?.catatan) return setErrorMessage(result.error.fields.catatan[0]);
      return toast({ tone: "danger", message: result.error.message });
    }
    // 4. Berhasil: toast sesuai keputusan, lalu muat ulang data halaman.
    toast({
      tone: "success",
      message:
        status === "disetujui"
          ? "Banner disetujui."
          : status === "ditolak"
            ? "Banner ditolak."
            : "Banner dinonaktifkan.",
    });
    router.refresh();
  }

  // 3. Arsipkan atau pulihkan banner; pesan penolakan backend (mis. 409) tampil apa adanya.
  async function setBannerArchive(archive: boolean) {
    setBusy(true);
    const result = await callAction(() => setAdminBannerArchived(banner.id, archive));
    setBusy(false);
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: archive ? "Banner diarsipkan." : "Banner dipulihkan." });
    router.refresh();
  }

  return (
    <article
      aria-label={banner.title}
      className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
      <img src={banner.image_url} alt="" className="aspect-[2/1] w-full rounded-md object-cover" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{banner.title}</p>
          <p className="text-sm text-ink-muted">{banner.merchant?.business_name ?? "Platform KateringKita"}</p>
        </div>
        <Badge tone={statusView.tone} icon={statusView.icon}>
          {statusView.label}
        </Badge>
      </div>
      <p className="text-sm text-ink-muted">
        {banner.target === "promo" && banner.promo
          ? `Voucher ${banner.promo.code}`
          : banner.target === "merchant"
            ? "Halaman toko"
            : "Tanpa tujuan"}
        {" · "}
        {formatDate(banner.starts_at)} – {formatDate(banner.ends_at)}
        {banner.merchant ? "" : ` · urutan ${banner.sort_order}`}
      </p>
      {banner.catatan && <p className="text-sm text-ink-muted">Catatan: {banner.catatan}</p>}
      {canEdit && archived && (
        <div className="mt-auto flex justify-end border-t border-line pt-3">
          <Button variant="secondary" disabled={busy} onClick={() => void setBannerArchive(false)}>
            Pulihkan
          </Button>
        </div>
      )}
      {canEdit && !archived && (
        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
          {banner.status === "menunggu" && (
            <Field label="Alasan penolakan" id={`alasan-banner-${banner.id}`} error={errorMessage}>
              <Input
                value={reason}
                maxLength={300}
                onChange={(event) => {
                  setReason(event.target.value);
                  setErrorMessage(undefined);
                }}
              />
            </Field>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {/* Isi banner toko hanya diubah penjualnya, jadi tombol Ubah khusus banner platform */}
            {!banner.merchant && (
              <Button variant="secondary" disabled={busy} onClick={onEdit}>
                Ubah
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={() => setArchiveConfirmOpen(true)}>
              Arsipkan
            </Button>
            {banner.status === "menunggu" && (
              <Button variant="secondary" disabled={busy} onClick={() => void review("ditolak")}>
                Tolak
              </Button>
            )}
            {(banner.status === "menunggu" || banner.status === "ditolak" || banner.status === "nonaktif") && (
              <Button disabled={busy} onClick={() => setConfirmOpen(true)}>
                Setujui
              </Button>
            )}
            {banner.status === "disetujui" && (
              <Button variant="secondary" disabled={busy} onClick={() => void review("nonaktif")}>
                Nonaktifkan
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Setujui lewat konfirmasi dulu: banner yang disetujui tampil ke semua pembeli, jadi salah klik bisa batal */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        tone="primary"
        busy={busy}
        title="Setujui banner?"
        body="Banner ini akan tampil di beranda aplikasi pembeli sesuai jadwalnya."
        confirmLabel="Ya, setujui"
        onConfirm={() => {
          setConfirmOpen(false);
          void review("disetujui");
        }}
      />
      <ConfirmDialog
        open={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        tone="danger"
        busy={busy}
        title="Arsipkan banner?"
        body="Banner ini berhenti tampil di aplikasi pembeli. Banner bisa dipulihkan dari tampilan Arsip."
        confirmLabel="Ya, arsipkan"
        onConfirm={() => {
          setArchiveConfirmOpen(false);
          void setBannerArchive(true);
        }}
      />
    </article>
  );
}

/**
 * Banner beranda: antrean pengajuan penjual + banner platform. Super & ops memutuskan, mengubah banner platform, dan
 * mengarsipkan; support hanya melihat.
 * @param props.banners banner dari backend (yang tidak diarsipkan, atau yang diarsipkan di tampilan Arsip)
 * @param props.vouchers voucher platform yang bisa jadi tujuan banner platform
 * @param props.canEdit true bila admin boleh meninjau, membuat, mengubah, dan mengarsipkan banner (super dan ops)
 * @param props.archived true di tampilan Arsip: tanpa tombol buat, tinjau, ubah, dan arsip; hanya pulihkan
 * @returns tombol buat banner, kartu banner, dan dialog BannerForm
 */
export function BannerAdmin({
  banners,
  vouchers,
  canEdit,
  archived = false,
}: {
  banners: Banner[];
  vouchers: VoucherOption[];
  canEdit: boolean;
  archived?: boolean;
}) {
  // Isi dialog formulir: "new" = banner platform baru, Banner = banner platform yang diubah, null = tertutup.
  const router = useRouter();
  const [form, setForm] = useState<"new" | Banner | null>(null);
  // eslint-disable-next-line react-hooks/purity -- status tayang/berakhir dihitung saat render
  const now = Date.now();
  return (
    <div className="flex flex-col gap-4">
      {canEdit && !archived && (
        <div>
          <Button onClick={() => setForm("new")}>
            <Plus aria-hidden className="size-4" />
            Buat banner platform
          </Button>
        </div>
      )}
      {banners.length === 0 ? (
        archived ? (
          <EmptyState
            icon={ImageIcon}
            title="Belum ada banner yang diarsipkan"
            body="Banner yang diarsipkan muncul di sini dan bisa dipulihkan."
          />
        ) : (
          <EmptyState
            icon={ImageIcon}
            title="Belum ada banner"
            body="Pengajuan banner penjual dan banner platform muncul di sini."
          />
        )
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <li key={banner.id}>
              <BannerCard
                banner={banner}
                now={now}
                canEdit={canEdit}
                archived={archived}
                onEdit={() => setForm(banner)}
              />
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form === "new" ? "Buat banner platform" : "Ubah banner platform"}
        className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {form !== null && (
          <BannerForm
            mode="admin"
            banner={form === "new" ? null : form}
            vouchers={form === "new" ? vouchers : withCurrentVoucher(vouchers, form.promo)}
            saveAction={form === "new" ? createAdminBanner : updateAdminBannerContent}
            requestUpload={requestAdminUpload}
            onClose={() => setForm(null)}
            onSaved={() => {
              setForm(null);
              toast({ tone: "success", message: form === "new" ? "Banner platform tayang." : "Banner disimpan." });
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
