// Komponen MerchantMenuList: daftar menu sebuah toko di panel admin, dengan tautan ubah dan tombol hapus (konfirmasi).
// Dipakai app/(admin)/admin/penjual/[id]/menu/page.tsx. Hapus memakai server action deleteMerchantMenu.
// "use client": kolom tabel berupa fungsi dan tombol hapus memakai state.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { deleteMerchantMenu } from "@/app/actions/admin/merchant-edit";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatRupiah } from "@/lib/format";
import type { MerchantMenu } from "@/types/menu";

/**
 * Daftar menu toko.
 * @param props.merchantId id toko
 * @param props.menus      menu toko
 * @param props.canEdit    `false` menyembunyikan tautan ubah dan tombol hapus (admin support)
 * @returns tabel menu atau keadaan kosong, beserta dialog konfirmasi hapus
 */
export function MerchantMenuList({
  merchantId,
  menus,
  canEdit,
}: {
  merchantId: number;
  menus: MerchantMenu[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<MerchantMenu | null>(null);
  const [busy, setBusy] = useState(false);

  // Menghapus menu yang dipilih, lalu memuat ulang daftar.
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await callAction(() => deleteMerchantMenu(merchantId, deleting.id));
    setBusy(false);
    setDeleting(null);
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: "Menu dihapus" });
    router.refresh();
  }

  const columns: Column<MerchantMenu>[] = [
    {
      key: "nama",
      header: "Menu",
      cell: (menu) =>
        canEdit ? (
          <Link
            href={`/admin/penjual/${merchantId}/menu/${menu.id}`}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {menu.name}
          </Link>
        ) : (
          <span className="font-semibold">{menu.name}</span>
        ),
    },
    { key: "harga", header: "Harga", align: "right", cell: (menu) => formatRupiah(menu.price) },
    { key: "status", header: "Status", cell: (menu) => (menu.is_active ? "Aktif" : "Nonaktif") },
    ...(canEdit
      ? [
          {
            key: "aksi",
            header: "Aksi",
            cell: (menu: MerchantMenu) => (
              <Button variant="ghost" onClick={() => setDeleting(menu)}>
                Hapus
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {menus.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Belum ada menu" body="Menu toko ini akan tampil di sini." />
      ) : (
        <DataTable columns={columns} rows={menus} rowKey={(menu) => String(menu.id)} caption="Menu toko" />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus menu?"
        body={`"${deleting?.name ?? ""}" tidak tampil lagi di toko. Riwayat pesanan yang memuat menu ini tetap tersimpan.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        busy={busy}
        onConfirm={confirmDelete}
      />
    </>
  );
}
