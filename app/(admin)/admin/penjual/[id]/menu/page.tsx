// Halaman /admin/penjual/[id]/menu: daftar menu sebuah toko, dengan tombol tambah, ubah, dan hapus (selain support).
// Server component: mengambil menu dari backend GET /admin/merchants/:id/menus.
import { MerchantMenuList } from "@/app/(admin)/admin/components/MerchantMenuList";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { MerchantMenu } from "@/types/menu";

/**
 * Menu toko di panel admin.
 * @param props.params `id` toko dari URL
 * @returns halaman daftar menu
 */
export default async function MerchantMenusPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireAdmin();
  const { id } = await params;
  const merchantId = /^[1-9]\d{0,9}$/.test(id) ? Number(id) : 0;
  const response = merchantId ? await adminFetch<MerchantMenu[]>(`/merchants/${merchantId}/menus`) : null;
  const canEdit = user.admin_level !== "support";
  return (
    <PageHeader
      title="Menu toko"
      description="Menu yang ditambah admin tampil tanpa foto sampai penjual mengunggahnya."
      actions={
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/admin/penjual/${id}`} variant="secondary">
            Kembali ke penjual
          </LinkButton>
          {canEdit && merchantId > 0 && <LinkButton href={`/admin/penjual/${id}/menu/baru`}>Tambah menu</LinkButton>}
        </div>
      }
    >
      {response?.ok && response.data ? (
        <MerchantMenuList merchantId={merchantId} menus={response.data} canEdit={canEdit} />
      ) : (
        <LoadError
          title={response?.status === 404 || !response ? "Penjual tidak ditemukan" : "Menu belum bisa dimuat"}
          body="Kembali ke daftar penjual lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
