import { LoadError } from "@/app/components/LoadError";
import { SettingsForm } from "@/app/(dashboard)/pengaturan/components/SettingsForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPickupPoints } from "@/services/meta.service";
import { getProfile } from "@/services/profile.service";
import { getTables } from "@/services/table.service";
import { getMyPayouts } from "@/services/payout.service";
import { requireMerchant } from "@/services/auth.service";

const toText = (value: unknown) => (typeof value === "string" ? value : "");

// M-10, PG-*. `?lengkapi=<bagian>` dari kartu "Siapkan toko" (PG-A2).
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireMerchant();
  const [profile, pickupPoints, tables, payouts, params] = await Promise.all([
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
      {"error" in profile ? (
        <LoadError title="Pengaturan belum bisa dimuat" body="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <SettingsForm
          profile={profile.data}
          pickupPoints={"error" in pickupPoints ? null : pickupPoints.data}
          tables={"error" in tables ? null : tables.data}
          payouts={"error" in payouts ? null : payouts.data}
          user={{ full_name: toText(user.full_name), phone: toText(user.phone), email: toText(user.email) }}
          incompleteSection={typeof params.lengkapi === "string" ? params.lengkapi : undefined}
        />
      )}
    </PageHeader>
  );
}
