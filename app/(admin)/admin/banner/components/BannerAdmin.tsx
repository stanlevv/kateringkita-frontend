"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus } from "lucide-react";
import { buatBannerAdmin, mintaUnggahAdmin, tinjauBannerAdmin } from "@/app/actions/admin/banner";
import { BannerForm } from "@/app/components/banner/BannerForm";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { statusBanner } from "@/lib/banner";
import { formatTanggal } from "@/lib/format";
import type { Banner, PilihanVoucher } from "@/types/banner";

const ALASAN = "Tulis alasan penolakan (3–300 karakter).";

function KartuBanner({ b, now, bolehUbah }: { b: Banner; now: number; bolehUbah: boolean }) {
  const router = useRouter();
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sibuk, setSibuk] = useState(false);
  const st = statusBanner(b, now);

  async function tinjau(status: "disetujui" | "ditolak" | "nonaktif") {
    if (status === "ditolak" && alasan.trim().length < 3) return setGalat(ALASAN);
    setSibuk(true);
    const r = await panggil(() => tinjauBannerAdmin(b.id, status === "ditolak" ? { status, catatan: alasan.trim() } : { status }));
    setSibuk(false);
    if ("error" in r) {
      if (r.error.fields?.catatan) return setGalat(r.error.fields.catatan[0]);
      return toast({ tone: "danger", message: r.error.message });
    }
    toast({ tone: "success", message: status === "disetujui" ? "Banner disetujui." : status === "ditolak" ? "Banner ditolak." : "Banner dinonaktifkan." });
    router.refresh();
  }

  return (
    <article aria-label={b.title} className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
      <img src={b.image_url} alt="" className="aspect-[2/1] w-full rounded-md object-cover" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{b.title}</p>
          <p className="text-sm text-ink-muted">{b.merchant?.business_name ?? "Platform KateringKita"}</p>
        </div>
        <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
      </div>
      <p className="text-sm text-ink-muted">
        {b.target === "promo" && b.promo ? `Voucher ${b.promo.code}` : b.target === "merchant" ? "Halaman toko" : "Tanpa tujuan"}
        {" · "}{formatTanggal(b.starts_at)} – {formatTanggal(b.ends_at)}{b.merchant ? "" : ` · urutan ${b.sort_order}`}
      </p>
      {b.catatan && <p className="text-sm text-ink-muted">Catatan: {b.catatan}</p>}
      {bolehUbah && (
        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
          {b.status === "menunggu" && (
            <Field label="Alasan penolakan" id={`alasan-banner-${b.id}`} error={galat}>
              <Input value={alasan} maxLength={300} onChange={(e) => { setAlasan(e.target.value); setGalat(undefined); }} />
            </Field>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {b.status === "menunggu" && <Button variant="secondary" disabled={sibuk} onClick={() => void tinjau("ditolak")}>Tolak</Button>}
            {(b.status === "menunggu" || b.status === "ditolak" || b.status === "nonaktif") && (
              <Button disabled={sibuk} onClick={() => void tinjau("disetujui")}>Setujui</Button>
            )}
            {b.status === "disetujui" && <Button variant="secondary" disabled={sibuk} onClick={() => void tinjau("nonaktif")}>Nonaktifkan</Button>}
          </div>
        </div>
      )}
    </article>
  );
}

/** Banner beranda: antrean pengajuan penjual + banner platform. Super & ops memutuskan; support hanya melihat. */
export function BannerAdmin({ banners, vouchers, bolehUbah }: { banners: Banner[]; vouchers: PilihanVoucher[]; bolehUbah: boolean }) {
  const router = useRouter();
  const [buat, setBuat] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- status tayang/berakhir dihitung saat render
  const now = Date.now();
  return (
    <div className="flex flex-col gap-4">
      {bolehUbah && <div><Button onClick={() => setBuat(true)}><Plus aria-hidden className="size-4" />Buat banner platform</Button></div>}
      {banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Belum ada banner" body="Pengajuan banner penjual dan banner platform muncul di sini." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => <li key={b.id}><KartuBanner b={b} now={now} bolehUbah={bolehUbah} /></li>)}
        </ul>
      )}
      <Dialog open={buat} onClose={() => setBuat(false)} title="Buat banner platform" className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto">
        {buat && (
          <BannerForm mode="admin" vouchers={vouchers} simpan={buatBannerAdmin} mintaUnggah={mintaUnggahAdmin}
            onClose={() => setBuat(false)}
            onSaved={() => { setBuat(false); toast({ tone: "success", message: "Banner platform tayang." }); router.refresh(); }} />
        )}
      </Dialog>
    </div>
  );
}
