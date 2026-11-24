// Halaman /pesanan: daftar pesanan penjual dengan cari, filter tanggal dan status, serta halaman (paginasi), ditambah
// filter "Chat belum dibalas" (?chat=belum-dibalas) yang menampilkan pesanan yang pesan chat terakhirnya dari pembeli.
// Server component: membaca searchParams (parameter URL seperti ?tanggal=&status=&q=&page=), mengambil satu halaman
// pesanan lewat getOrders (atau daftar chat belum dibalas lewat getUnrepliedChats) di server, lalu menyerahkannya ke
// OrderTable (atau UnrepliedChatList).
import { Suspense } from "react";
import Link from "next/link";
import { OrderTable } from "@/app/(dashboard)/pesanan/components/OrderTable";
import { UnrepliedChatList } from "@/app/(dashboard)/pesanan/components/UnrepliedChatList";
import { cx, focusRing } from "@/app/components/ui/cx";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getOrders } from "@/services/order.service";
import { getUnrepliedChats } from "@/services/order-chat.service";
import { todayWib } from "@/lib/format";
import { STATUS_FILTER } from "@/lib/order-filter";
import { requireMerchant } from "@/services/auth.service";

/** Nilai pertama parameter URL (parameter yang diulang bisa berupa array); kosong bila tidak ada. */
const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Nilai `?chat=` untuk filter chat belum dibalas. */
const UNREPLIED_CHAT_FILTER = "belum-dibalas";

/**
 * Tautan pilihan daftar: semua pesanan atau chat belum dibalas. Bentuknya mengikuti komponen Tabs.
 * @param props.isChatFilter filter chat sedang aktif
 * @returns elemen `nav` berisi dua tautan
 */
function ListSwitch({ isChatFilter }: { isChatFilter: boolean }) {
  const links = [
    { href: "/pesanan", label: "Semua pesanan", isActive: !isChatFilter },
    { href: `/pesanan?chat=${UNREPLIED_CHAT_FILTER}`, label: "Chat belum dibalas", isActive: isChatFilter },
  ];
  return (
    <nav aria-label="Pilihan daftar" className="flex gap-1 overflow-x-auto border-b border-line">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.isActive ? "page" : undefined}
          className={cx(
            "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-4 font-medium",
            focusRing,
            link.isActive ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Halaman daftar pesanan. Filter dan halaman disimpan di URL dan diproses server, jadi tautan bisa dibagikan dan
 * tombol Back bekerja.
 * @param props.searchParams parameter URL: `tanggal` (YYYY-MM-DD), `status`, `q` (kode/nama), `page`, dan
 *   `chat=belum-dibalas` (daftar chat belum dibalas; filter lain diabaikan)
 * @returns PageHeader berisi pilihan daftar dan OrderTable (atau UnrepliedChatList). Suspense dibutuhkan karena
 * OrderTable membaca URL di klien (useSearchParams).
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 1. Pastikan penjual sudah masuk, lalu baca parameter URL.
  await requireMerchant();
  const query = await searchParams;
  // 2. Filter chat: ambil daftar chat belum dibalas saja, tanpa daftar pesanan.
  if (firstValue(query.chat) === UNREPLIED_CHAT_FILTER) {
    const chats = await getUnrepliedChats();
    return (
      <PageHeader title="Pesanan">
        <div className="flex flex-col gap-4">
          <ListSwitch isChatFilter />
          <UnrepliedChatList chats={"data" in chats ? chats.data : null} />
        </div>
      </PageHeader>
    );
  }
  const date = firstValue(query.tanggal);
  const status = STATUS_FILTER.find((filter) => filter.id === firstValue(query.status))?.id;
  // 3. Nilai yang tidak sah diabaikan: tanggal bawaan hari ini (WIB), q maksimal 50 karakter, halaman minimal 1.
  const orders = await getOrders({
    status,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayWib(),
    q: firstValue(query.q).trim().slice(0, 50) || undefined,
    page: Math.max(1, Math.floor(Number(firstValue(query.page))) || 1),
  });
  return (
    <PageHeader title="Pesanan">
      <div className="flex flex-col gap-4">
        <ListSwitch isChatFilter={false} />
        <Suspense>
          <OrderTable
            rows={"data" in orders ? orders.data.rows : []}
            total={"data" in orders ? orders.data.total : 0}
            loadFailed={"error" in orders}
          />
        </Suspense>
      </div>
    </PageHeader>
  );
}
