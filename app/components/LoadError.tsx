"use client";

import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { EmptyState } from "@/app/components/ui/EmptyState";

/** G-1 gagal muat: pesan sebab + Coba lagi (muat ulang data server). */
export function LoadError({
  title = "Data dashboard belum bisa dimuat",
  body = "Terjadi kesalahan saat mengambil pesanan dan kuota. Periksa koneksi lalu coba lagi.",
}: {
  title?: string;
  body?: string;
}) {
  const router = useRouter();
  return (
    <div role="alert">
      <EmptyState
        icon={CloudOff}
        title={title}
        body={body}
        action={<Button onClick={() => router.refresh()}>Coba lagi</Button>}
      />
    </div>
  );
}
