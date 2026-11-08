import { HppKalkulator } from "@/app/(dashboard)/copilot/components/HppKalkulator";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { requireMerchant } from "@/services/authService";

// M-12 (P2) — Kalkulator HPP (HP-N1, HP-N2, HP-E1).
export default async function KalkulatorHppPage() {
  await requireMerchant();
  return (
    <PageHeader title="Kalkulator HPP" description="Hitung modal per porsi dan saran harga jual dari bahan yang dipakai.">
      <HppKalkulator />
    </PageHeader>
  );
}
