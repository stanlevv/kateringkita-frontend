import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPemakaianAi, getPenyediaAi } from "@/services/adminAiService";
import { requireAdmin } from "@/services/authService";
import { PemakaianAi } from "./components/PemakaianAi";
import { PenyediaAiPanel } from "./components/PenyediaAiPanel";

// F22 penyedia AI (gratis) dengan fallback otomatis + F25 pemakaian (token, panggilan, gagal). ?hari=7|30
export default async function AdminAiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("super");
  const hari = (await searchParams).hari === "30" ? 30 : 7;
  const [r, pakai] = await Promise.all([getPenyediaAi(), getPemakaianAi(hari)]);
  return (
    <PageHeader title="AI" description="Pantau pemakaian dan atur penyedia AI untuk asisten toko & rekomendasi pembeli. Penyedia dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya.">
      <div className="flex flex-col gap-10">
        {"error" in pakai ? <GagalMuat judul="Pemakaian AI belum bisa dimuat" isi="Data gagal dimuat. Coba lagi." /> : <PemakaianAi data={pakai.data} />}
        {"error" in r ? <GagalMuat judul="Penyedia AI belum bisa dimuat" isi="Data gagal dimuat. Coba lagi." /> : <PenyediaAiPanel data={r.data} />}
      </div>
    </PageHeader>
  );
}
