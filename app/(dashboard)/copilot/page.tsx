import { HppKalkulator } from "@/components/hpp/HppKalkulator";
import { PageHeader } from "@/components/shell/PageHeader";
import { requireMerchant } from "@/lib/session";

// M-12 (P2) — Kalkulator HPP (HP-N1, HP-N2, HP-E1).
export default async function KalkulatorHppPage() {
  await requireMerchant();
  return (
    <PageHeader title="Kalkulator HPP" description="Hitung modal per porsi dan saran harga jual dari bahan yang dipakai.">
      <HppKalkulator />
    </PageHeader>
  );
}
