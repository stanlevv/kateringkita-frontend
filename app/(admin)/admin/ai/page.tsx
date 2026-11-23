// Halaman /admin/ai (gerbang AI): pemakaian AI dan daftar penyedia AI. Penyedia AI = layanan model bahasa (mis. Google
// Gemini, Groq) yang dipakai asisten toko dan rekomendasi pembeli, masing-masing dengan API key gratis milik sendiri.
// Urutan fallback: backend mencoba penyedia aktif dari prioritas terkecil; bila satu kena batas atau error, penyedia
// berikutnya dicoba. Server component: membaca searchParams (?hari=7|30), mengambil data lewat
// services/admin-ai.service.ts (GET /admin/ai-providers dan /admin/ai-usage). Hanya admin super.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getAiUsage, getAiProviders } from "@/services/admin-ai.service";
import { requireAdmin } from "@/services/auth.service";
import { AiUsagePanel } from "./components/AiUsagePanel";
import { AiProvidersPanel } from "./components/AiProvidersPanel";

/**
 * Halaman AI. Pemakaian dan penyedia dimuat bersamaan; bila salah satu gagal, bagian lain tetap tampil.
 * @param props.searchParams parameter URL: `hari` ("30" untuk 30 hari; selain itu 7 hari)
 * @returns PageHeader berisi AiUsagePanel dan AiProvidersPanel (atau LoadError per bagian)
 */
export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin("super");
  const days = (await searchParams).hari === "30" ? 30 : 7;
  const [providers, usage] = await Promise.all([getAiProviders(), getAiUsage(days)]);
  return (
    <PageHeader
      title="AI"
      description="Pantau pemakaian dan atur penyedia AI untuk asisten toko & rekomendasi pembeli. Penyedia dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya."
    >
      <div className="flex flex-col gap-10">
        {"error" in usage ? (
          <LoadError title="Pemakaian AI belum bisa dimuat" body="Data gagal dimuat. Coba lagi." />
        ) : (
          <AiUsagePanel data={usage.data} />
        )}
        {"error" in providers ? (
          <LoadError title="Penyedia AI belum bisa dimuat" body="Data gagal dimuat. Coba lagi." />
        ) : (
          <AiProvidersPanel data={providers.data} />
        )}
      </div>
    </PageHeader>
  );
}
