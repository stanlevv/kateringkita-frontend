// Kerangka memuat /admin/penjual/baru. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka form admin: beberapa pasangan label–isian lalu tombol simpan.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Tambah penjual"
      description="Buat akun pemilik dan tokonya. Toko mulai berstatus menunggu verifikasi."
    >
      <div className="flex max-w-xl flex-col gap-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonText width="w-32" />
            <SkeletonText size="lg" width="w-full" />
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
