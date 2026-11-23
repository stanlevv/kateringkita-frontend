import { notFound } from "next/navigation";
import { requireMerchant } from "@/services/auth.service";
import { getScenario, SCENARIOS } from "@/lib/scenario";

export default async function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requireMerchant();
  const activeScenario = await getScenario();
  const linkClass =
    "block min-h-11 rounded-md border border-line bg-surface p-4 hover:bg-subtle focus-visible:ring-2 focus-visible:ring-info";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-ink">Pratinjau skenario</h1>
      <p className="mt-1 text-ink-muted">
        Pilih keadaan untuk mencoba tampilan dashboard dengan data contoh. Aktif sekarang:{" "}
        <strong className="text-ink">
          {SCENARIOS.find((scenario) => scenario.id === activeScenario)?.label ?? "Normal"}
        </strong>
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <a href={`/api/skenario?nilai=${scenario.id}&ke=/dashboard`} className={linkClass}>
              <span className="block font-semibold text-ink">{scenario.label}</span>
              <span className="block text-sm text-ink-muted">{scenario.description}</span>
            </a>
          </li>
        ))}
      </ul>
      <a href="/api/skenario?nilai=hapus&ke=/pratinjau" className={`${linkClass} mt-4 font-semibold text-primary`}>
        Hapus skenario
      </a>
    </div>
  );
}
