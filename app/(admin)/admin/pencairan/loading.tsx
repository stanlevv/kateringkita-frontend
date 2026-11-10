import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { SkeletonTabel, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Saldo per toko, dana yang harus dikembalikan, riwayat pencairan.
export default function Loading() {
  return (
    <RangkaHalaman judul="Pencairan dana" deskripsi="Transfer bagian toko dari pembayaran Virtual Account dan online, lalu catat di sini. Kembalikan dana pesanan batal yang sudah dibayar.">
      <div className="flex flex-col gap-6">
        {[4, 3, 3].map((baris, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <SkeletonTeks ukuran="lg" lebar="w-40" />
            <SkeletonTabel baris={baris} kolom={6} />
          </Card>
        ))}
      </div>
    </RangkaHalaman>
  );
}
