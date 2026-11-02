import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { formatRupiah } from "@/lib/format";

/** Kartu menu seperti dilihat pembeli. Tanpa HPP (R-11). */
export function MenuPreview({ name, price, unit, category, photo, options }: { name: string; price: number | null; unit: string; category: string; photo: string | null; options: { name: string; extra_price: number }[] }) {
  return (
    <section aria-label="Pratinjau untuk pembeli" className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="relative flex aspect-[16/9] items-center justify-center bg-subtle">
        {photo ? <Image src={photo} alt="" fill unoptimized sizes="320px" className="object-cover" /> : <UtensilsCrossed aria-hidden className="size-10 text-ink-muted" />}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm text-ink-muted">{category || "Kategori"}</p>
        <h3 className="font-semibold text-ink">{name.trim() || "Nama menu"}</h3>
        <p className="text-ink">
          <span className="font-mono font-semibold">{price === null ? "Rp –" : formatRupiah(price)}</span>
          <span className="text-ink-muted"> / {unit.trim() || "porsi"}</span>
        </p>
        {options.length > 0 && (
          <ul className="text-sm text-ink-muted">
            {options.filter((o) => o.name.trim()).map((o, i) => (
              <li key={i}>{o.name.trim()}{o.extra_price > 0 && ` (+${formatRupiah(o.extra_price)})`}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
