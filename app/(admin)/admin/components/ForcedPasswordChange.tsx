// Komponen ForcedPasswordChange: layar wajib ganti kata sandi yang menggantikan isi panel admin selama admin masih
// memakai sandi sementara (dipasang layout admin). Formulirnya ChangePasswordForm (app/components).
// "use client": komponen ini berjalan di peramban (client component) karena memakai router.
"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";
import { PageHeader } from "@/app/components/shell/PageHeader";

/**
 * Layar ganti sandi sementara. Admin baru atau yang sandinya direset masuk dengan sandi sementara; setelah sandi diganti,
 * panel dimuat ulang (router.refresh) sehingga layout menampilkan halaman biasa.
 * @returns PageHeader berisi ChangePasswordForm
 */
export function ForcedPasswordChange() {
  const router = useRouter();
  return (
    <PageHeader
      title="Ganti kata sandi sementara"
      description="Akun Anda memakai kata sandi sementara. Buat kata sandi sendiri sebelum memakai panel admin."
    >
      <ChangePasswordForm onPasswordChanged={() => router.refresh()} />
    </PageHeader>
  );
}
