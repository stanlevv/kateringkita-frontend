import { HppKalkulator } from "@/app/(dashboard)/copilot/components/HppKalkulator";
import { AsistenPanel } from "@/app/(dashboard)/copilot/components/AsistenPanel";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/authService";

// M-12 (P2) — Kalkulator HPP (HP-N1, HP-N2, HP-E1) + F17 asisten AI toko.
export default async function KalkulatorHppPage() {
  await requireMerchant();
  return (
    <PageHeader title="Kalkulator HPP" description="Hitung modal per porsi dan saran harga jual, lalu tanyakan strategi ke asisten AI.">
      <div className="flex flex-col gap-6">
        <HppKalkulator />
        <AsistenPanel />
      </div>
    </PageHeader>
  );
}
