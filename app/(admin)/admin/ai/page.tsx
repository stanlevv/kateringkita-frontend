import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPenyediaAi } from "@/services/adminAiService";
import { requireAdmin } from "@/services/authService";
import { PenyediaAiPanel } from "./components/PenyediaAiPanel";

// F22: penyedia AI (gratis) untuk Asisten AI; dicoba berurutan dengan fallback otomatis
export default async function AdminAiPage() {
  await requireAdmin();
  const r = await getPenyediaAi();
  return (
    <PageHeader title="AI" description="Atur penyedia AI untuk Asisten AI. Dicoba berurutan; bila satu kena batas atau error, otomatis pindah ke berikutnya.">
      {"error" in r ? <GagalMuat judul="Penyedia AI belum bisa dimuat" isi="Data gagal dimuat. Coba lagi." /> : <PenyediaAiPanel data={r.data} />}
    </PageHeader>
  );
}
