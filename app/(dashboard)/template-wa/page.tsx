// Halaman /template-wa: penjual mengatur templat pesan WhatsApp yang dikirim ke pembeli untuk setiap pesanan.
// Server component: mengambil profil toko (nama dan templat tersimpan) dan pesanan terbaru (contoh untuk pratinjau)
// dari backend lewat services/profile.service.ts dan order.service.ts.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { TemplateEditor } from "@/app/(dashboard)/template-wa/components/TemplateEditor";
import { getOrders } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman templat WhatsApp. Pesanan contoh untuk pratinjau = pesanan terbaru toko (boleh tidak ada).
 * @returns PageHeader berisi TemplateEditor, atau LoadError bila profil gagal dimuat
 */
export default async function WhatsappTemplatePage() {
  await requireMerchant();
  const [profile, orders] = await Promise.all([getProfile(), getOrders()]);
  return (
    <PageHeader
      title="Template WhatsApp"
      description="Atur isi pesan WhatsApp yang dikirim ke pembeli untuk setiap pesanan."
    >
      {"error" in profile ? (
        <LoadError title="Template belum bisa dimuat" body="Data toko gagal dimuat. Coba lagi." />
      ) : (
        <TemplateEditor
          merchantName={profile.data.business_name}
          template={profile.data.wa_template}
          order={"error" in orders ? null : (orders.data.rows[0] ?? null)}
        />
      )}
    </PageHeader>
  );
}
