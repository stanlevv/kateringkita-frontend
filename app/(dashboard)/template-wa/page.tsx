import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { TemplateEditor } from "@/app/(dashboard)/template-wa/components/TemplateEditor";
import { getOrders } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { requireMerchant } from "@/services/auth.service";

// M-11, WA-*. Pesanan contoh = pesanan terbaru toko.
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
          storeName={profile.data.business_name}
          template={profile.data.wa_template}
          order={"error" in orders ? null : (orders.data.rows[0] ?? null)}
        />
      )}
    </PageHeader>
  );
}
