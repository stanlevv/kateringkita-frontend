// Komponen Checklist: daftar kelengkapan toko (WhatsApp valid, alamat, titik temu, menu aktif, menu berfoto, jam buka) yang
// diperiksa admin sebelum memverifikasi penjual. Label butir dari CHECKLIST_LABELS (services/admin-merchant.service.ts).
import { Check, X } from "lucide-react";
import { CHECKLIST_LABELS } from "@/services/admin-merchant.service";
import type { Checklist as ChecklistItems } from "@/types/admin";

/**
 * Checklist kelengkapan toko. Tiap butir memakai ikon dan teks (tidak hanya warna), plus teks tersembunyi untuk pembaca
 * layar.
 * @param props.checklist status tiap butir dari backend (true = terpenuhi)
 * @returns daftar butir
 */
export function Checklist({ checklist }: { checklist: ChecklistItems }) {
  return (
    <ul aria-label="Checklist toko" className="flex flex-col gap-1 text-sm">
      {(Object.keys(CHECKLIST_LABELS) as (keyof ChecklistItems)[]).map((field) => (
        <li
          key={field}
          className={checklist[field] ? "flex items-center gap-2 text-success" : "flex items-center gap-2 text-danger"}
        >
          {checklist[field] ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
          <span>{CHECKLIST_LABELS[field]}</span>
          <span className="sr-only">{checklist[field] ? "terpenuhi" : "belum terpenuhi"}</span>
        </li>
      ))}
    </ul>
  );
}
