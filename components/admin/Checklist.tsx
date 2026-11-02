import { Check, X } from "lucide-react";
import { LABEL_CHECKLIST } from "@/lib/admin/merchants";
import type { Checklist as Daftar } from "@/lib/admin/types";

/** Checklist kelengkapan toko: ikon + teks (tidak hanya warna). */
export function Checklist({ checklist }: { checklist: Daftar }) {
  return (
    <ul aria-label="Checklist toko" className="flex flex-col gap-1 text-sm">
      {(Object.keys(LABEL_CHECKLIST) as (keyof Daftar)[]).map((k) => (
        <li key={k} className={checklist[k] ? "flex items-center gap-2 text-success" : "flex items-center gap-2 text-danger"}>
          {checklist[k] ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
          <span>{LABEL_CHECKLIST[k]}</span>
          <span className="sr-only">{checklist[k] ? "terpenuhi" : "belum terpenuhi"}</span>
        </li>
      ))}
    </ul>
  );
}
