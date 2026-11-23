import { redirect } from "next/navigation";
import { merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";

// M-04, M-11: tautan WA dibangun backend dari templat toko; hanya wa.me yang diikuti (cegah redirect terbuka).
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  await requireMerchant();
  const { code } = await params;
  const response = await merchantFetch<{ url: string }>(`/orders/${encodeURIComponent(code)}/whatsapp`);
  const url = response.ok ? response.data?.url : undefined;
  redirect(
    typeof url === "string" && url.startsWith("https://wa.me/") ? url : `/pesanan/${encodeURIComponent(code)}?wa=gagal`,
  );
}
