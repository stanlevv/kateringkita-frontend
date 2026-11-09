import { GagalMuat } from "@/app/components/GagalMuat";
import { SettingsForm } from "@/app/(dashboard)/pengaturan/components/SettingsForm";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getPickupPoints } from "@/services/metaService";
import { getProfile } from "@/services/profileService";
import { getTables } from "@/services/mejaService";
import { requireMerchant } from "@/services/authService";

const teks = (v: unknown) => (typeof v === "string" ? v : "");

// M-10, PG-*. `?lengkapi=<bagian>` dari kartu "Siapkan toko" (PG-A2).
export default async function PengaturanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireMerchant();
  const [profil, titik, meja, q] = await Promise.all([getProfile(), getPickupPoints(), getTables(), searchParams]);
  return (
    <PageHeader title="Pengaturan toko" description="Atur profil, jam buka, titik temu, pembayaran, pesan dari meja, dan akun.">
      {"error" in profil ? (
        <GagalMuat judul="Pengaturan belum bisa dimuat" isi="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <SettingsForm
          profile={profil.data}
          pickupPoints={"error" in titik ? null : titik.data}
          tables={"error" in meja ? null : meja.data}
          user={{ full_name: teks(user.full_name), phone: teks(user.phone), email: teks(user.email) }}
          lengkapi={typeof q.lengkapi === "string" ? q.lengkapi : undefined}
        />
      )}
    </PageHeader>
  );
}
