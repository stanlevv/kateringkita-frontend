import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { getPickupPoints } from "@/lib/data/meta";
import { getProfile } from "@/lib/data/profile";
import { requireMerchant } from "@/lib/session";

const teks = (v: unknown) => (typeof v === "string" ? v : "");

// M-10, PG-*. `?lengkapi=<bagian>` dari kartu "Siapkan toko" (PG-A2).
export default async function PengaturanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireMerchant();
  const [profil, titik, q] = await Promise.all([getProfile(), getPickupPoints(), searchParams]);
  return (
    <PageHeader title="Pengaturan toko" description="Atur profil, jam buka, titik temu, pembayaran, dan akun.">
      {"error" in profil ? (
        <GagalMuat judul="Pengaturan belum bisa dimuat" isi="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <SettingsForm
          profile={profil.data}
          pickupPoints={"error" in titik ? null : titik.data}
          user={{ full_name: teks(user.full_name), phone: teks(user.phone), email: teks(user.email) }}
          lengkapi={typeof q.lengkapi === "string" ? q.lengkapi : undefined}
        />
      )}
    </PageHeader>
  );
}
