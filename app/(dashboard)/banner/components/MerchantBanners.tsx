"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus } from "lucide-react";
import { deleteMerchantBanner, saveMerchantBanner } from "@/app/actions/banner";
import { BannerForm } from "@/app/components/banner/BannerForm";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { isBannerActive, bannerStatus } from "@/lib/banner";
import { formatDate } from "@/lib/format";
import type { Banner, VoucherOption } from "@/types/banner";

/** Banner toko: satu banner aktif (menunggu / tayang) per toko; ditolak bisa diajukan ulang. */
export function BannerToko({ banners, vouchers }: { banners: Banner[]; vouchers: VoucherOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Banner | "baru" | null>(null);
  // eslint-disable-next-line react-hooks/purity -- status tayang/berakhir dihitung saat render
  const now = Date.now();
  const adaAktif = banners.some((b) => isBannerActive(b, now));

  async function hapus(b: Banner) {
    const r = await callAction(() => deleteMerchantBanner(b.id));
    if ("error" in r) return toast({ tone: "danger", message: r.error.message });
    toast({ tone: "success", message: "Banner dihapus." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!adaAktif && (
        <div>
          <Button onClick={() => setForm("baru")}>
            <Plus aria-hidden className="size-4" />
            Ajukan banner
          </Button>
        </div>
      )}
      {banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Belum ada banner"
          body="Banner tokomu tampil di beranda aplikasi pembeli setelah disetujui admin. Satu banner aktif per toko."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => {
            const st = bannerStatus(b, now);
            return (
              <li key={b.id}>
                <article
                  aria-label={b.title}
                  className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
                  <img src={b.image_url} alt="" className="aspect-[2/1] w-full rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{b.title}</p>
                    <Badge tone={st.tone} icon={st.icon}>
                      {st.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {b.target === "promo" && b.promo ? `Voucher ${b.promo.code}` : "Halaman toko"} ·{" "}
                    {formatDate(b.starts_at)} – {formatDate(b.ends_at)}
                  </p>
                  {b.status === "ditolak" && b.catatan && (
                    <p className="text-sm text-danger">Alasan admin: {b.catatan}</p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {(b.status === "ditolak" || b.status === "menunggu") && (
                      <Button variant="secondary" onClick={() => setForm(b)}>
                        {b.status === "ditolak" ? "Ajukan ulang" : "Ubah"}
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => void hapus(b)}>
                      Hapus
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form === "baru" ? "Ajukan banner" : "Ubah banner"}
        className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {form !== null && (
          <BannerForm
            mode="toko"
            banner={form === "baru" ? null : form}
            vouchers={vouchers}
            simpan={saveMerchantBanner}
            onClose={() => setForm(null)}
            onSaved={() => {
              setForm(null);
              toast({ tone: "success", message: "Banner diajukan. Tunggu persetujuan admin." });
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
