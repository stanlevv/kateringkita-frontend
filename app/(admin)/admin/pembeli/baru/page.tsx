// Halaman /admin/pembeli/baru: form tambah akun pembeli. Hanya untuk admin super dan ops (support mendapat 404).
import { CustomerCreateForm } from "@/app/(admin)/admin/components/CustomerForms";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { requireAdmin } from "@/services/auth.service";

/**
 * Tambah pembeli.
 * @returns halaman berisi form tambah pembeli
 */
export default async function NewCustomerPage() {
  await requireAdmin("super", "ops");
  return (
    <PageHeader
      title="Tambah pembeli"
      description="Buat akun pembeli. Sandi awal disampaikan ke pembeli; ia bisa menggantinya sendiri."
      actions={
        <LinkButton href="/admin/pembeli" variant="secondary">
          Semua pembeli
        </LinkButton>
      }
    >
      <CustomerCreateForm />
    </PageHeader>
  );
}
