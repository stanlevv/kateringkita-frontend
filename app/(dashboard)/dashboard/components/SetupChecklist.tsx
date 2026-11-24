// Komponen SetupChecklist: kartu "Siapkan toko" untuk penjual baru. Dipakai DashboardLive selama toko belum punya
// titik temu atau menu.
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { cx, focusRing } from "@/app/components/ui/cx";

type Props = {
  /** Toko sudah memilih titik temu. */
  hasPickupPoints: boolean;
  /** Toko sudah punya menu. */
  hasMenus: boolean;
  /** Dapur sedang buka. */
  storeOpen: boolean;
  /** Membuka dapur. */
  onOpenStore: () => void;
  /** Permintaan buka dapur sedang berjalan. */
  opening?: boolean;
};

const LINK_CLASS = cx(
  "inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline",
  focusRing,
);

/**
 * Kartu tiga langkah persiapan toko (pengaturan titik temu, menu pertama, buka dapur). Langkah dicentang otomatis
 * dari data, bukan ditandai manual.
 * @param props.hasPickupPoints langkah 1 selesai
 * @param props.hasMenus langkah 2 selesai
 * @param props.storeOpen langkah 3 selesai
 * @param props.onOpenStore membuka dapur dari tombol langkah 3
 * @param props.opening tombol buka dapur sedang memuat
 * @returns elemen `section`
 */
export function SetupChecklist({ hasPickupPoints, hasMenus, storeOpen, onOpenStore, opening }: Props) {
  // 1. Susun tiga langkah: status selesai dan isi (tautan atau tombol) tiap langkah.
  const steps = [
    {
      done: hasPickupPoints,
      content: (
        <Link href="/pengaturan?lengkapi=titik-temu" className={LINK_CLASS}>
          Lengkapi pengaturan
        </Link>
      ),
    },
    {
      done: hasMenus,
      content: (
        <Link href="/menu/baru" className={LINK_CLASS}>
          Tambah menu pertama
        </Link>
      ),
    },
    {
      done: storeOpen,
      content: storeOpen ? (
        <span className="inline-flex min-h-11 items-center font-medium text-ink">Buka dapur</span>
      ) : (
        <Button variant="secondary" loading={opening} onClick={onOpenStore}>
          Buka dapur
        </Button>
      ),
    },
  ];
  return (
    <section aria-labelledby="judul-siapkan" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="judul-siapkan" className="text-lg font-semibold text-ink">
        Siapkan toko
      </h2>
      <p className="text-sm text-ink-muted">Selesaikan tiga langkah ini agar pembeli bisa mulai memesan.</p>
      <ol className="mt-3 flex flex-col gap-1">
        {steps.map((step, i) => (
          <li key={i} data-selesai={String(step.done)} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cx(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                step.done ? "bg-success-bg text-success" : "bg-subtle text-ink",
              )}
            >
              {step.done ? <Check className="size-4" /> : i + 1}
            </span>
            {step.content}
            <span className="text-sm text-ink-muted">{step.done ? "Selesai" : "Belum"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
