import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList, SkeletonTabs } from "@/app/components/ui/Skeleton";

// DaftarHasilAi: tab status + pilihan fitur, lalu kartu hasil AI.
export default function Loading() {
  return (
    <PageFrame
      title="Verifikasi AI"
      description="Keluaran asisten toko dan rekomendasi pembeli yang sudah lolos validasi format. Periksa, lalu setujui atau tolak dengan alasan."
    >
      <div className="flex flex-col gap-4">
        <SkeletonTabs count={4} />
        <SkeletonList columns={3} />
      </div>
    </PageFrame>
  );
}
