import { notFound } from "next/navigation";
import { requireMerchant } from "@/lib/session";
import { getSkenario, SKENARIO } from "@/lib/skenario";

export default async function PratinjauPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requireMerchant();
  const aktif = await getSkenario();
  const link = "block min-h-11 rounded-md border border-line bg-surface p-4 hover:bg-subtle focus-visible:ring-2 focus-visible:ring-info";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-ink">Pratinjau skenario</h1>
      <p className="mt-1 text-ink-muted">
        Pilih keadaan untuk mencoba tampilan dashboard dengan data contoh. Aktif sekarang:{" "}
        <strong className="text-ink">{SKENARIO.find((s) => s.id === aktif)?.label ?? "Normal"}</strong>
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {SKENARIO.map((s) => (
          <li key={s.id}>
            <a href={`/api/skenario?nilai=${s.id}&ke=/dashboard`} className={link}>
              <span className="block font-semibold text-ink">{s.label}</span>
              <span className="block text-sm text-ink-muted">{s.deskripsi}</span>
            </a>
          </li>
        ))}
      </ul>
      <a href="/api/skenario?nilai=hapus&ke=/pratinjau" className={`${link} mt-4 font-semibold text-primary`}>
        Hapus skenario
      </a>
    </div>
  );
}
