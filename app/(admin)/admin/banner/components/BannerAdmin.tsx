"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus } from "lucide-react";
import { createAdminBanner, requestAdminUpload, reviewAdminBanner } from "@/app/actions/admin/banner";
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
import type { Banner, VoucherOption } from "@/types/banner";

const REASON_HINT = "Tulis alasan penolakan (3–300 karakter).";

function BannerCard({ banner, now, canEdit }: { banner: Banner; now: number; canEdit: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusView = bannerStatus(banner, now);

  async function review(status: "disetujui" | "ditolak" | "nonaktif") {
    if (status === "ditolak" && reason.trim().length < 3) return setErrorMessage(REASON_HINT);
    setBusy(true);
    const result = await callAction(() =>
      reviewAdminBanner(banner.id, status === "ditolak" ? { status, catatan: reason.trim() } : { status }),
    );
    setBusy(false);
    if ("error" in result) {
      if (result.error.fields?.catatan) return setErrorMessage(result.error.fields.catatan[0]);
      return toast({ tone: "danger", message: result.error.message });
    }
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
      {canEdit && (
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
      {/* AUD-35: persetujuan tidak jalan dengan sekali klik */}
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
    </article>
  );
}

/** Banner beranda: antrean pengajuan penjual + banner platform. Super & ops memutuskan; support hanya melihat. */
export function BannerAdmin({
  banners,
  vouchers,
  canEdit,
}: {
  banners: Banner[];
  vouchers: VoucherOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- status tayang/berakhir dihitung saat render
  const now = Date.now();
  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden className="size-4" />
            Buat banner platform
          </Button>
        </div>
      )}
      {banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Belum ada banner"
          body="Pengajuan banner penjual dan banner platform muncul di sini."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <li key={banner.id}>
              <BannerCard banner={banner} now={now} canEdit={canEdit} />
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat banner platform"
        className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {createOpen && (
          <BannerForm
            mode="admin"
            vouchers={vouchers}
            saveAction={createAdminBanner}
            requestUpload={requestAdminUpload}
            onClose={() => setCreateOpen(false)}
            onSaved={() => {
              setCreateOpen(false);
              toast({ tone: "success", message: "Banner platform tayang." });
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
