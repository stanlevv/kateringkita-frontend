"use client";

import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** G-1 gagal muat: pesan sebab + Coba lagi (muat ulang data server). */
export function GagalMuat({ judul = "Data dashboard belum bisa dimuat", isi = "Terjadi kesalahan saat mengambil pesanan dan kuota. Periksa koneksi lalu coba lagi." }: { judul?: string; isi?: string }) {
  const router = useRouter();
  return (
    <div role="alert">
      <EmptyState icon={CloudOff} title={judul} body={isi} action={<Button onClick={() => router.refresh()}>Coba lagi</Button>} />
    </div>
  );
}
