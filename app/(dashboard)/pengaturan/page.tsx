import { LoadError } from "@/app/components/LoadError";
import { SettingsForm } from "@/app/(dashboard)/pengaturan/components/SettingsForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPickupPoints } from "@/services/meta.service";
import { getProfile } from "@/services/profile.service";
import { getTables } from "@/services/table.service";
import { getMyPayouts } from "@/services/payout.service";
import { requireMerchant } from "@/services/auth.service";

const teks = (v: unknown) => (typeof v === "string" ? v : "");

// M-10, PG-*. `?lengkapi=<bagian>` dari kartu "Siapkan toko" (PG-A2).
export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireMerchant();
  const [profil, titik, meja, cair, q] = await Promise.all([
    getProfile(),
    getPickupPoints(),
    getTables(),
    getMyPayouts(),
    searchParams,
  ]);
  return (
    <PageHeader
      title="Pengaturan toko"
      description="Atur profil, jam buka, titik temu, rekening pencairan, pesan dari meja, dan akun."
    >
      {"error" in profil ? (
        <LoadError title="Pengaturan belum bisa dimuat" body="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <SettingsForm
          profile={profil.data}
          pickupPoints={"error" in titik ? null : titik.data}
          tables={"error" in meja ? null : meja.data}
          pencairan={"error" in cair ? null : cair.data}
          user={{ full_name: teks(user.full_name), phone: teks(user.phone), email: teks(user.email) }}
          lengkapi={typeof q.lengkapi === "string" ? q.lengkapi : undefined}
        />
      )}
    </PageHeader>
  );
}
