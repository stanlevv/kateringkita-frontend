import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getAiUsage, getAiProviders } from "@/services/admin-ai.service";
import { requireAdmin } from "@/services/auth.service";
import { PemakaianAi } from "./components/AiUsagePanel";
import { PenyediaAiPanel } from "./components/AiProvidersPanel";

// F22 penyedia AI (gratis) dengan fallback otomatis + F25 pemakaian (token, panggilan, gagal). ?hari=7|30
export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin("super");
  const hari = (await searchParams).hari === "30" ? 30 : 7;
  const [r, pakai] = await Promise.all([getAiProviders(), getAiUsage(hari)]);
  return (
    <PageHeader
      title="AI"
      description="Pantau pemakaian dan atur penyedia AI untuk asisten toko & rekomendasi pembeli. Penyedia dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya."
    >
      <div className="flex flex-col gap-10">
        {"error" in pakai ? (
          <LoadError title="Pemakaian AI belum bisa dimuat" body="Data gagal dimuat. Coba lagi." />
        ) : (
          <PemakaianAi data={pakai.data} />
        )}
        {"error" in r ? (
          <LoadError title="Penyedia AI belum bisa dimuat" body="Data gagal dimuat. Coba lagi." />
        ) : (
          <PenyediaAiPanel data={r.data} />
        )}
      </div>
    </PageHeader>
  );
}
