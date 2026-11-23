import { PageFrame } from "@/app/components/shell/PageFrame";
import { Card } from "@/app/components/ui/Card";
import { SkeletonTable, SkeletonText } from "@/app/components/ui/Skeleton";

// Saldo per toko, dana yang harus dikembalikan, riwayat pencairan.
export default function Loading() {
  return (
    <PageFrame
      title="Pencairan dana"
      description="Transfer bagian toko dari pembayaran Virtual Account dan online, lalu catat di sini. Kembalikan dana pesanan batal yang sudah dibayar."
    >
      <div className="flex flex-col gap-6">
        {[4, 3, 3].map((rowCount, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <SkeletonText size="lg" width="w-40" />
            <SkeletonTable rows={rowCount} columns={6} />
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}
