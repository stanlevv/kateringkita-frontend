"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";
import { PageHeader } from "@/app/components/shell/PageHeader";

// Fase 1: admin baru / sandi direset masuk dengan sandi sementara. Setelah diganti, panel dimuat ulang.
export function GantiSandiWajib() {
  const router = useRouter();
  return (
    <PageHeader title="Ganti kata sandi sementara" description="Akun Anda memakai kata sandi sementara. Buat kata sandi sendiri sebelum memakai panel admin.">
      <ChangePasswordForm onSelesai={() => router.refresh()} />
    </PageHeader>
  );
}
