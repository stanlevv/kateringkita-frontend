// Halaman /copilot: Kalkulator HPP (modal per porsi dan saran harga jual) dan asisten AI toko (copilot) untuk
// bertanya strategi harga dan menu. Server component: hanya memeriksa sesi; kedua bagian adalah client component.
import { HppCalculator } from "@/app/(dashboard)/copilot/components/HppCalculator";
import { AssistantPanel } from "@/app/(dashboard)/copilot/components/AssistantPanel";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman kalkulator HPP dan asisten AI.
 * @returns PageHeader berisi HppCalculator dan AssistantPanel
 */
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
