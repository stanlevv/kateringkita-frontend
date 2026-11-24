// Halaman /admin/pembeli/[id]: detail pembeli (ringkasan pesanan), status akun, dan form ubah data.
// Server component: mengambil data dari backend GET /admin/customers/:id.
import { SearchX } from "lucide-react";
import { AccountStatusToggle } from "@/app/(admin)/admin/components/AccountStatusToggle";
import { CustomerEditForm } from "@/app/(admin)/admin/components/CustomerForms";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { formatDate, formatPhone, formatRupiah } from "@/lib/format";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { CustomerDetail } from "@/types/admin";

/**
 * Detail pembeli. Form ubah dan tombol status hanya aktif untuk admin selain support.
 * @param props.params `id` pembeli dari URL
 * @returns halaman detail, atau keadaan "tidak ditemukan"
 */
export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Wajib admin; id yang bukan angka langsung dianggap tidak ada.
  const { user } = await requireAdmin();
  const { id } = await params;
  const notFound = (
    <EmptyState
      icon={SearchX}
      title="Pembeli tidak ditemukan"
      body="Pembeli ini tidak ada."
      action={
        <LinkButton href="/admin/pembeli" variant="secondary">
          Kembali ke daftar pembeli
        </LinkButton>
      }
    />
  );
  if (!/^[1-9]\d{0,9}$/.test(id)) return notFound;
  // 2. Ambil detail dari backend.
  const response = await adminFetch<CustomerDetail>(`/customers/${id}`);
  if (response.status === 404) return notFound;
  if (!response.ok || !response.data)
    return (
      <LoadError
        title="Pembeli belum bisa dimuat"
        body="Terjadi kesalahan saat mengambil data pembeli. Periksa koneksi lalu coba lagi."
      />
    );
  const customer = response.data;
  const canEdit = user.admin_level !== "support";
  const stats = [
    { label: "Pesanan", value: String(customer.orders.total) },
    { label: "Selesai", value: String(customer.orders.completed) },
    { label: "Batal/kedaluwarsa", value: String(customer.orders.cancelled) },
    { label: "Total belanja", value: formatRupiah(customer.orders.spent) },
  ];
  return (
    <PageHeader
      title={customer.full_name}
      actions={
        <LinkButton href="/admin/pembeli" variant="secondary">
          Semua pembeli
        </LinkButton>
      }
    >
      <div className="flex flex-col gap-8">
        <section
          aria-label="Ringkasan pembeli"
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4"
        >
          <AccountStatusToggle kind="customer" id={customer.id} active={customer.is_active} canEdit={canEdit} />
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-ink-muted">Nomor WA</dt>
              <dd className="font-mono font-medium text-ink">{formatPhone(customer.phone)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Email</dt>
              <dd className="break-all font-medium text-ink">
                {customer.email ?? "-"}{" "}
                {customer.email && (customer.email_verified ? "(terverifikasi)" : "(belum diverifikasi)")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Terdaftar</dt>
              <dd className="font-medium text-ink">{formatDate(customer.created_at)}</dd>
            </div>
          </dl>
          <dl className="grid gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md bg-subtle p-3">
                <dt className="text-sm text-ink-muted">{stat.label}</dt>
                <dd className="text-lg font-semibold text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {canEdit && (
          <CustomerEditForm
            customerId={customer.id}
            initial={{ full_name: customer.full_name, phone: customer.phone, email: customer.email ?? "" }}
          />
        )}
      </div>
    </PageHeader>
  );
}
