"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ScanLine, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { payTableOrder, createTableOrder } from "@/app/actions/table";
import { Button } from "@/app/components/ui/Button";
import { cx, focusRing } from "@/app/components/ui/cx";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatRupiah } from "@/lib/format";
import {
  unitPrice,
  countItems,
  toSavedLines,
  restoreCart,
  menuQty,
  addToCart,
  cartTotal,
  updateQty,
  type CartLine,
} from "@/lib/table-cart";
import {
  readGuestName,
  readCartRaw,
  subscribe,
  saveCart,
  saveLastTable,
  saveGuestName,
  saveGuest,
  parseCart,
} from "@/lib/table-storage";
import type { MenuOption } from "@/types/menu";
import type { TableMenu, TableMenuItem } from "@/types/table";

// Panel bawah di HP, kotak di layar lebar
const SHEET_CLASS = "mx-auto mb-0 mt-auto max-h-[88dvh] rounded-b-none rounded-t-2xl sm:mb-auto sm:rounded-2xl";
const toDottedTime = (time: string) => time.replace(":", ".");

function Stepper({
  value,
  onChange,
  label,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
}) {
  const buttonClass = cx(
    "flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:bg-subtle",
    focusRing,
  );
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={`Jumlah ${label}`}>
      <button
        type="button"
        className={buttonClass}
        aria-label={`Kurangi ${label}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <span className="w-6 text-center font-mono text-lg font-bold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={buttonClass} aria-label={`Tambah ${label}`} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function MenuPhoto({ menu, qty }: { menu: TableMenuItem; qty: number }) {
  const soldOut = menu.badge === "sold_out";
  return (
    <div className="relative size-24 shrink-0">
      <div className="relative size-24 overflow-hidden rounded-full bg-primary-soft shadow-md ring-4 ring-surface">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt=""
            fill
            unoptimized
            sizes="96px"
            className={cx("object-cover", soldOut && "grayscale")}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UtensilsCrossed aria-hidden className="size-8 text-primary" />
          </span>
        )}
      </div>
      {qty > 0 && (
        <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-steel px-1.5 font-mono text-sm font-bold text-on-steel">
          {qty}×
        </span>
      )}
      {soldOut && (
        <span className="absolute inset-x-[-4px] top-1/2 -translate-y-1/2 -rotate-12 rounded border-2 border-danger bg-surface/90 py-0.5 text-center text-xs font-black uppercase tracking-[0.2em] text-danger">
          Habis
        </span>
      )}
    </div>
  );
}

function TableMenuCard({
  menu,
  qty,
  storeOpen,
  onAdd,
}: {
  menu: TableMenuItem;
  qty: number;
  storeOpen: boolean;
  onAdd: () => void;
}) {
  const soldOut = menu.badge === "sold_out";
  return (
    <li
      className={cx(
        "flex gap-4 rounded-2xl border bg-surface p-3 shadow-sm transition-colors",
        qty > 0 ? "border-accent" : "border-line",
      )}
    >
      <MenuPhoto menu={menu} qty={qty} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug text-ink">{menu.name}</h3>
        {menu.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{menu.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-mono font-bold text-ink">
              {formatRupiah(menu.price)}
              <span className="text-xs font-normal text-ink-muted"> /{menu.unit_label}</span>
            </p>
            {menu.badge === "low_stock" && (
              <p className="text-xs font-medium text-warning">
                Sisa {menu.available} {menu.unit_label}
              </p>
            )}
            {menu.min_order_qty > 1 && (
              <p className="text-xs text-ink-muted">
                Min. {menu.min_order_qty} {menu.unit_label}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut || !storeOpen}
            aria-label={`Tambah ${menu.name}`}
            className={cx(
              "flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink shadow hover:bg-accent-pressed disabled:bg-line disabled:text-ink-muted disabled:shadow-none",
              focusRing,
            )}
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function OptionPicker({ menu, onAdd }: { menu: TableMenuItem; onAdd: (options: MenuOption[], qty: number) => void }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [qty, setQty] = useState(menu.min_order_qty);
  const selectedOptions = menu.options.filter((option) => selectedIds.includes(option.id));
  return (
    <div className="flex flex-col gap-5">
      {menu.description && <p className="text-ink-muted">{menu.description}</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Tambahan (opsional)</legend>
        {menu.options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                setSelectedIds((ids) => (selected ? ids.filter((id) => id !== option.id) : [...ids, option.id]))
              }
              className={cx(
                "flex min-h-12 items-center justify-between rounded-xl border px-4 text-left",
                selected ? "border-accent bg-primary-soft font-semibold" : "border-line bg-surface",
                focusRing,
              )}
            >
              <span>{option.name}</span>
              <span className="font-mono text-sm">
                {option.extra_price ? `+${formatRupiah(option.extra_price)}` : "Gratis"}
              </span>
            </button>
          );
        })}
      </fieldset>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Jumlah</span>
        <Stepper
          value={qty}
          min={menu.min_order_qty}
          label={menu.name}
          onChange={(value) => setQty(Math.max(menu.min_order_qty, value))}
        />
      </div>
      <Button size="lg" className="w-full" onClick={() => onAdd(selectedOptions, qty)}>
        Tambah ke pesanan · {formatRupiah(unitPrice({ menu, options: selectedOptions }) * qty)}
      </Button>
    </div>
  );
}

export function TableMenuApp({ token, data }: { token: string; data: TableMenu }) {
  const router = useRouter();
  const { merchant, table } = data;
  // keranjang tersimpan di peramban (bertahan saat muat ulang); render server = kosong
  const rawCart = useSyncExternalStore(
    subscribe,
    () => readCartRaw(token),
    () => null,
  );
  const cartLines = useMemo(() => restoreCart(parseCart(rawCart), data.menus), [rawCart, data.menus]);
  const setCartLines = (lines: CartLine[]) => saveCart(token, toSavedLines(lines));
  const savedName = useSyncExternalStore(subscribe, readGuestName, () => "");
  const [typedName, setTypedName] = useState<string | null>(null);
  const customerName = typedName ?? savedName;
  const [optionsMenu, setOptionsMenu] = useState<TableMenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(() => {
    const bySlug = new Map<string, { slug: string; name: string; items: TableMenuItem[] }>();
    for (const menu of data.menus) {
      const category = bySlug.get(menu.category.slug) ?? {
        slug: menu.category.slug,
        name: menu.category.name,
        items: [],
      };
      category.items.push(menu);
      bySlug.set(menu.category.slug, category);
    }
    return [...bySlug.values()];
  }, [data.menus]);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug);

  // meja diingat untuk start_url PWA (/meja)
  useEffect(() => saveLastTable(token), [token]);

  // sorot kategori yang sedang terlihat
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];
        if (topEntry) setActiveCategory(topEntry.target.id.replace("kat-", ""));
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    categories.forEach((category) => {
      const section = document.getElementById(`kat-${category.slug}`);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [categories]);

  const total = cartTotal(cartLines);
  const itemCount = countItems(cartLines);

  function addMenu(menu: TableMenuItem, options: MenuOption[], qty: number) {
    const nextLines = addToCart(cartLines, menu, options, qty);
    if (!nextLines) {
      toast({ tone: "warning", message: `Sisa ${menu.name} tinggal ${menu.available} ${menu.unit_label}.` });
      return false;
    }
    setCartLines(nextLines);
    return true;
  }

  function changeQty(lineKey: string, qty: number) {
    const nextLines = updateQty(cartLines, lineKey, qty);
    if (nextLines) setCartLines(nextLines);
    else toast({ tone: "warning", message: "Jumlah melebihi sisa porsi." });
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (!customerName.trim()) return setErrorMessage("Isi nama pemesan agar pesanan bisa diantar ke kamu.");
    setSubmitting(true);
    setErrorMessage(null);
    const result = await callAction(() =>
      createTableOrder(token, {
        items: toSavedLines(cartLines),
        customer_name: customerName.trim(),
        customer_phone: phone || null,
        note: note.trim() || null,
      }),
    );
    if ("error" in result) {
      setSubmitting(false);
      return setErrorMessage([result.error.message, ...Object.values(result.error.fields ?? {}).flat()].join(" "));
    }
    const { code, guest_token } = result.data;
    saveGuest(code, { tamu: guest_token, meja: token });
    saveGuestName(customerName.trim());
    const payment = await callAction(() =>
      payTableOrder(code, guest_token, `${window.location.origin}/meja/pesanan/${code}`),
    );
    // dikosongkan saat diteruskan, bukan selagi form masih terbuka menunggu tautan bayar (sempat tampil "Rp 0")
    setCartLines([]);
    if ("data" in payment) return window.location.assign(payment.data.payment_url);
    router.push(`/meja/pesanan/${code}`); // halaman status menyediakan tombol bayar ulang
  }

  return (
    <>
      <header className="relative bg-gradient-to-br from-accent to-accent-pressed pb-9 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-start gap-4 px-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-surface ring-4 ring-surface/60">
            {merchant.logo_url ? (
              <Image src={merchant.logo_url} alt="" fill unoptimized sizes="64px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-2xl font-bold text-primary">
                {merchant.business_name.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Pesan dari meja</p>
            <h1 className="font-display text-2xl font-bold leading-tight text-ink">{merchant.business_name}</h1>
            {merchant.description && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{merchant.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border-2 border-dashed border-ink/70 bg-surface/90 px-3 py-1 font-mono text-sm font-bold text-ink">
                MEJA {table.label}
              </span>
              <span
                className={cx(
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  merchant.is_open ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
                )}
              >
                {merchant.is_open
                  ? `Buka · sampai ${toDottedTime(merchant.close_time)}`
                  : `Tutup · buka ${toDottedTime(merchant.open_time)}`}
              </span>
              <Link
                href="/meja?pindai=1"
                className={cx(
                  "inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-sm font-semibold text-ink hover:bg-surface",
                  focusRing,
                )}
              >
                <ScanLine aria-hidden className="size-4" />
                Scan meja lain
              </Link>
            </div>
          </div>
        </div>
        {/* tepi bergerigi seperti struk */}
        <div
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-3"
          style={{
            background:
              "radial-gradient(circle at 8px 0, transparent 7px, var(--color-canvas) 7.5px) 0 0 / 16px 12px repeat-x",
          }}
        />
      </header>

      {categories.length > 1 && (
        <nav aria-label="Kategori menu" className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
          <ul className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
            {categories.map((category) => (
              <li key={category.slug} className="shrink-0">
                <a
                  href={`#kat-${category.slug}`}
                  aria-current={activeCategory === category.slug ? "true" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
                    activeCategory === category.slug
                      ? "border-steel bg-steel text-on-steel"
                      : "border-line bg-surface text-ink",
                    focusRing,
                  )}
                >
                  {category.name}
                  <span className="font-mono text-xs opacity-70">{category.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pb-40 pt-5">
        {!merchant.is_open && (
          <p role="status" className="rounded-xl bg-danger-bg px-4 py-3 text-danger">
            Toko sedang tutup. Kamu bisa melihat menu, pemesanan dibuka lagi pukul {toDottedTime(merchant.open_time)}{" "}
            WIB.
          </p>
        )}
        {categories.length === 0 && (
          <p className="text-center text-ink-muted">Belum ada menu yang bisa dipesan dari meja.</p>
        )}
        {categories.map((category) => (
          <section
            key={category.slug}
            id={`kat-${category.slug}`}
            aria-labelledby={`judul-${category.slug}`}
            className="scroll-mt-20"
          >
            <h2 id={`judul-${category.slug}`} className="mb-3 flex items-center gap-3 font-display text-lg font-bold">
              {category.name}
              <span aria-hidden className="h-px flex-1 border-t-2 border-dotted border-line-strong" />
            </h2>
            <ul className="flex flex-col gap-3">
              {category.items.map((menu) => (
                <TableMenuCard
                  key={menu.id}
                  menu={menu}
                  qty={menuQty(cartLines, menu.id)}
                  storeOpen={merchant.is_open}
                  onAdd={() => (menu.options.length ? setOptionsMenu(menu) : addMenu(menu, [], 1))}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className={cx(
              "mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-steel px-4 py-3 text-left text-on-steel shadow-xl",
              focusRing,
            )}
          >
            <span className="relative">
              <ShoppingBag aria-hidden className="size-6" />
              <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-ink">
                {itemCount}
              </span>
            </span>
            <span className="flex-1">
              <span className="block text-xs text-on-steel-muted">Pesanan Meja {table.label}</span>
              <span className="font-mono text-lg font-bold" aria-live="polite">
                {formatRupiah(total)}
              </span>
            </span>
            <span className="rounded-xl bg-accent px-4 py-2 font-semibold text-ink">Lihat pesanan</span>
          </button>
        </div>
      )}

      <Dialog
        open={!!optionsMenu}
        onClose={() => setOptionsMenu(null)}
        title={optionsMenu?.name ?? ""}
        className={SHEET_CLASS}
      >
        {optionsMenu && (
          <OptionPicker
            menu={optionsMenu}
            onAdd={(options, qty) => addMenu(optionsMenu, options, qty) && setOptionsMenu(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`Pesanan Meja ${table.label}`}
        className={SHEET_CLASS}
      >
        <form onSubmit={placeOrder} noValidate className="flex flex-col gap-5">
          {cartLines.length === 0 ? (
            <p className="text-ink-muted">Pesanan masih kosong.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {cartLines.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{line.menu.name}</p>
                    {line.options.length > 0 && (
                      <p className="text-sm text-ink-muted">+ {line.options.map((option) => option.name).join(", ")}</p>
                    )}
                    <p className="font-mono text-sm">{formatRupiah(unitPrice(line) * line.qty)}</p>
                  </div>
                  <Stepper value={line.qty} label={line.menu.name} onChange={(value) => changeQty(line.key, value)} />
                </li>
              ))}
            </ul>
          )}
          <Field label="Nama pemesan" id="meja-nama" required help="Dipanggil saat pesanan diantar ke meja.">
            <Input
              value={customerName}
              maxLength={60}
              autoComplete="name"
              onChange={(event) => setTypedName(event.target.value)}
            />
          </Field>
          <Field
            label="Nomor WhatsApp (opsional)"
            id="meja-hp"
            help="Hanya bila toko perlu menghubungimu. Contoh: 081234567890"
          >
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              maxLength={13}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Catatan untuk dapur (opsional)" id="meja-catatan" help={`${note.length}/255 karakter`}>
            <Textarea value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-subtle px-4 py-3">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-mono text-lg font-bold">{formatRupiah(total)}</span>
          </div>
          {errorMessage && (
            <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
            loadingText="Membuat pesanan…"
            disabled={cartLines.length === 0}
          >
            Pesan &amp; bayar
          </Button>
          <p className="text-center text-xs text-ink-muted">
            Bayar lewat Midtrans: QRIS, GoPay, ShopeePay, atau Virtual Account. Biaya layanan (bila ada) tampil di
            halaman bayar.
          </p>
        </form>
      </Dialog>
    </>
  );
}
