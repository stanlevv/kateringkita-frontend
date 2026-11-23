import { Check, X } from "lucide-react";
import { CHECKLIST_LABELS } from "@/services/admin-merchant.service";
import type { Checklist as Daftar } from "@/types/admin";

/** Checklist kelengkapan toko: ikon + teks (tidak hanya warna). */
export function Checklist({ checklist }: { checklist: Daftar }) {
  return (
    <ul aria-label="Checklist toko" className="flex flex-col gap-1 text-sm">
      {(Object.keys(CHECKLIST_LABELS) as (keyof Daftar)[]).map((k) => (
        <li
          key={k}
          className={checklist[k] ? "flex items-center gap-2 text-success" : "flex items-center gap-2 text-danger"}
        >
          {checklist[k] ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
          <span>{CHECKLIST_LABELS[k]}</span>
          <span className="sr-only">{checklist[k] ? "terpenuhi" : "belum terpenuhi"}</span>
        </li>
      ))}
    </ul>
  );
}
