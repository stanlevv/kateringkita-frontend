import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { TemplateEditor } from "@/app/(dashboard)/template-wa/components/TemplateEditor";
import { getOrders } from "@/services/orderService";
import { getProfile } from "@/services/profileService";
import { requireMerchant } from "@/services/authService";

// M-11, WA-*. Pesanan contoh = pesanan terbaru toko.
export default async function TemplateWAPage() {
  await requireMerchant();
  const [profil, pesanan] = await Promise.all([getProfile(), getOrders()]);
  return (
    <PageHeader title="Template WhatsApp" description="Atur isi pesan WhatsApp yang dikirim ke pembeli untuk setiap pesanan.">
      {"error" in profil ? (
        <GagalMuat judul="Template belum bisa dimuat" isi="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <TemplateEditor namaToko={profil.data.business_name} template={profil.data.wa_template} order={"error" in pesanan ? null : (pesanan.data.rows[0] ?? null)} />
      )}
    </PageHeader>
  );
}
