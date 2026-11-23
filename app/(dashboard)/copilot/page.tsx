import { HppCalculator } from "@/app/(dashboard)/copilot/components/HppCalculator";
import { AssistantPanel } from "@/app/(dashboard)/copilot/components/AssistantPanel";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/auth.service";

// M-12 (P2) — Kalkulator HPP (HP-N1, HP-N2, HP-E1) + F17 asisten AI toko.
export default async function HppCalculatorPage() {
  await requireMerchant();
  return (
    <PageHeader
      title="Kalkulator HPP"
      description="Hitung modal per porsi dan saran harga jual, lalu tanyakan strategi ke asisten AI."
    >
      <div className="flex flex-col gap-6">
        <HppCalculator />
        <AssistantPanel />
      </div>
    </PageHeader>
  );
}
