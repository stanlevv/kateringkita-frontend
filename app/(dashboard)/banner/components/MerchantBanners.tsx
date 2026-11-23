// Komponen MerchantBanners: daftar banner toko di /banner dengan status (menunggu, tayang, ditolak, berakhir) dan
// dialog BannerForm untuk mengajukan atau mengubah. Banner disimpan dan dihapus lewat server action
// saveMerchantBanner dan deleteMerchantBanner (app/actions/banner.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
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

/**
 * Banner toko. Satu toko hanya boleh punya satu banner aktif (menunggu atau tayang), jadi tombol Ajukan disembunyikan
 * selama ada banner aktif. Banner yang ditolak bisa diajukan ulang.
 * @param props.banners banner milik toko
 * @param props.vouchers voucher toko yang bisa dijadikan tujuan banner
 * @returns tombol ajukan, kartu banner, dan dialog formulir
 */
export function MerchantBanners({ banners, vouchers }: { banners: Banner[]; vouchers: VoucherOption[] }) {
  // 1. Isi dialog: null = tertutup, "new" = banner baru, objek Banner = ubah banner itu.
  const router = useRouter();
  const [form, setForm] = useState<Banner | "new" | null>(null);
  // 2. Status tayang dihitung terhadap jam sekarang.
  // eslint-disable-next-line react-hooks/purity -- status tayang/berakhir dihitung saat render
  const now = Date.now();
  const hasActiveBanner = banners.some((banner) => isBannerActive(banner, now));

  // 3. Hapus banner, lalu muat ulang data server.
  async function deleteBanner(banner: Banner) {
    const result = await callAction(() => deleteMerchantBanner(banner.id));
    if ("error" in result) return toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: "Banner dihapus." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasActiveBanner && (
        <div>
          <Button onClick={() => setForm("new")}>
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
          {banners.map((banner) => {
            const statusBadge = bannerStatus(banner, now);
            return (
              <li key={banner.id}>
                <article
                  aria-label={banner.title}
                  className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari penyimpanan publik */}
                  <img src={banner.image_url} alt="" className="aspect-[2/1] w-full rounded-md object-cover" />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{banner.title}</p>
                    <Badge tone={statusBadge.tone} icon={statusBadge.icon}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {banner.target === "promo" && banner.promo ? `Voucher ${banner.promo.code}` : "Halaman toko"} ·{" "}
                    {formatDate(banner.starts_at)} – {formatDate(banner.ends_at)}
                  </p>
                  {banner.status === "ditolak" && banner.catatan && (
                    <p className="text-sm text-danger">Alasan admin: {banner.catatan}</p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {(banner.status === "ditolak" || banner.status === "menunggu") && (
                      <Button variant="secondary" onClick={() => setForm(banner)}>
                        {banner.status === "ditolak" ? "Ajukan ulang" : "Ubah"}
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => void deleteBanner(banner)}>
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
        title={form === "new" ? "Ajukan banner" : "Ubah banner"}
        className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto"
      >
        {form !== null && (
          <BannerForm
            mode="merchant"
            banner={form === "new" ? null : form}
            vouchers={vouchers}
            saveAction={saveMerchantBanner}
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
