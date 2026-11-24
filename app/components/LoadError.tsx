// Komponen LoadError: pesan "belum bisa dimuat" dengan tombol Coba lagi. Dipakai halaman yang datanya gagal diambil
// dari backend (dashboard, pesanan, menu, pengaturan, halaman admin, dan lainnya).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { EmptyState } from "@/app/components/ui/EmptyState";

/**
 * Layar gagal muat: judul, penjelasan sebab, dan tombol Coba lagi. Tombol memanggil router.refresh(), yaitu meminta
 * ulang data komponen server halaman ini tanpa memuat ulang seluruh peramban.
 * @param props.title judul pesan (bawaan: pesan untuk dashboard)
 * @param props.body penjelasan sebab dan saran (bawaan: pesan untuk dashboard)
 * @returns EmptyState di dalam `role="alert"` supaya pembaca layar langsung mengumumkannya
 */
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
