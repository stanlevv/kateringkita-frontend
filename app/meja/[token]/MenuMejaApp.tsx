"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { bayarPesananMeja, pesanDariMeja } from "@/app/actions/meja";
import { Button } from "@/app/components/ui/Button";
import { cx, fokus } from "@/app/components/ui/cx";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { formatRupiah } from "@/lib/format";
import { hargaSatuan, jumlahItem, keItems, pulihkan, qtyMenu, tambah, totalKeranjang, ubahQty, type Baris } from "@/lib/meja-keranjang";
import { bacaNama, keranjangMentah, langganan, simpanKeranjang, simpanMejaTerakhir, simpanNama, simpanTamu, uraiKeranjang } from "@/lib/meja-simpan";
import type { MenuOption } from "@/types/menu";
import type { MenuMeja, MenuMejaItem } from "@/types/meja";

// Panel bawah di HP, kotak di layar lebar
const LEMBAR = "mx-auto mb-0 mt-auto max-h-[88dvh] rounded-b-none rounded-t-2xl sm:mb-auto sm:rounded-2xl";
const jamTitik = (hhmm: string) => hhmm.replace(":", ".");

function Stepper({ nilai, onUbah, label, min = 0 }: { nilai: number; onUbah: (v: number) => void; label: string; min?: number }) {
  const tombol = cx("flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:bg-subtle", fokus);
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={`Jumlah ${label}`}>
      <button type="button" className={tombol} aria-label={`Kurangi ${label}`} onClick={() => onUbah(nilai - 1)} disabled={nilai <= min}><Minus aria-hidden className="size-4" /></button>
      <span className="w-6 text-center font-mono text-lg font-bold" aria-live="polite">{nilai}</span>
      <button type="button" className={tombol} aria-label={`Tambah ${label}`} onClick={() => onUbah(nilai + 1)}><Plus aria-hidden className="size-4" /></button>
    </div>
  );
}

function Piring({ m, qty }: { m: MenuMejaItem; qty: number }) {
  const habis = m.badge === "sold_out";
  return (
    <div className="relative size-24 shrink-0">
      <div className="relative size-24 overflow-hidden rounded-full bg-primary-soft shadow-md ring-4 ring-surface">
        {m.image_url
          ? <Image src={m.image_url} alt="" fill unoptimized sizes="96px" className={cx("object-cover", habis && "grayscale")} />
          : <span className="flex size-full items-center justify-center"><UtensilsCrossed aria-hidden className="size-8 text-primary" /></span>}
      </div>
      {qty > 0 && (
        <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-steel px-1.5 font-mono text-sm font-bold text-on-steel">{qty}×</span>
      )}
      {habis && (
        <span className="absolute inset-x-[-4px] top-1/2 -translate-y-1/2 -rotate-12 rounded border-2 border-danger bg-surface/90 py-0.5 text-center text-xs font-black uppercase tracking-[0.2em] text-danger">Habis</span>
      )}
    </div>
  );
}

function KartuMenu({ m, qty, buka, onTambah }: { m: MenuMejaItem; qty: number; buka: boolean; onTambah: () => void }) {
  const habis = m.badge === "sold_out";
  return (
    <li className={cx("flex gap-4 rounded-2xl border bg-surface p-3 shadow-sm transition-colors", qty > 0 ? "border-accent" : "border-line")}>
      <Piring m={m} qty={qty} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug text-ink">{m.name}</h3>
        {m.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{m.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-mono font-bold text-ink">{formatRupiah(m.price)}<span className="text-xs font-normal text-ink-muted"> /{m.unit_label}</span></p>
            {m.badge === "low_stock" && <p className="text-xs font-medium text-warning">Sisa {m.available} {m.unit_label}</p>}
            {m.min_order_qty > 1 && <p className="text-xs text-ink-muted">Min. {m.min_order_qty} {m.unit_label}</p>}
          </div>
          <button type="button" onClick={onTambah} disabled={habis || !buka} aria-label={`Tambah ${m.name}`}
            className={cx("flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink shadow hover:bg-accent-pressed disabled:bg-line disabled:text-ink-muted disabled:shadow-none", fokus)}>
            <Plus aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function PilihOpsi({ menu, onTambah }: { menu: MenuMejaItem; onTambah: (opsi: MenuOption[], qty: number) => void }) {
  const [dipilih, setDipilih] = useState<number[]>([]);
  const [qty, setQty] = useState(menu.min_order_qty);
  const opsi = menu.options.filter((o) => dipilih.includes(o.id));
  return (
    <div className="flex flex-col gap-5">
      {menu.description && <p className="text-ink-muted">{menu.description}</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Tambahan (opsional)</legend>
        {menu.options.map((o) => {
          const aktif = dipilih.includes(o.id);
          return (
            <button key={o.id} type="button" aria-pressed={aktif} onClick={() => setDipilih((d) => (aktif ? d.filter((x) => x !== o.id) : [...d, o.id]))}
              className={cx("flex min-h-12 items-center justify-between rounded-xl border px-4 text-left", aktif ? "border-accent bg-primary-soft font-semibold" : "border-line bg-surface", fokus)}>
              <span>{o.name}</span>
              <span className="font-mono text-sm">{o.extra_price ? `+${formatRupiah(o.extra_price)}` : "Gratis"}</span>
            </button>
          );
        })}
      </fieldset>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Jumlah</span>
        <Stepper nilai={qty} min={menu.min_order_qty} label={menu.name} onUbah={(v) => setQty(Math.max(menu.min_order_qty, v))} />
      </div>
      <Button size="lg" className="w-full" onClick={() => onTambah(opsi, qty)}>
        Tambah ke pesanan · {formatRupiah(hargaSatuan({ menu, opsi }) * qty)}
      </Button>
    </div>
  );
}

export function MenuMejaApp({ token, data }: { token: string; data: MenuMeja }) {
  const router = useRouter();
  const { merchant: toko, table: meja } = data;
  // keranjang tersimpan di peramban (bertahan saat muat ulang); render server = kosong
  const mentah = useSyncExternalStore(langganan, () => keranjangMentah(token), () => null);
  const baris = useMemo(() => pulihkan(uraiKeranjang(mentah), data.menus), [mentah, data.menus]);
  const setBaris = (b: Baris[]) => simpanKeranjang(token, keItems(b));
  const namaAwal = useSyncExternalStore(langganan, bacaNama, () => "");
  const [namaKetik, setNama] = useState<string | null>(null);
  const nama = namaKetik ?? namaAwal;
  const [pilih, setPilih] = useState<MenuMejaItem | null>(null);
  const [lihat, setLihat] = useState(false);
  const [hp, setHp] = useState("");
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [kirim, setKirim] = useState(false);

  const kategori = useMemo(() => {
    const per = new Map<string, { slug: string; name: string; items: MenuMejaItem[] }>();
    for (const m of data.menus) {
      const k = per.get(m.category.slug) ?? { slug: m.category.slug, name: m.category.name, items: [] };
      k.items.push(m);
      per.set(m.category.slug, k);
    }
    return [...per.values()];
  }, [data.menus]);
  const [aktifKat, setAktifKat] = useState(kategori[0]?.slug);

  // meja diingat untuk start_url PWA (/meja)
  useEffect(() => simpanMejaTerakhir(token), [token]);

  // sorot kategori yang sedang terlihat
  useEffect(() => {
    const amati = new IntersectionObserver((es) => {
      const terlihat = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (terlihat) setAktifKat(terlihat.target.id.replace("kat-", ""));
    }, { rootMargin: "-80px 0px -60% 0px" });
    kategori.forEach((k) => {
      const el = document.getElementById(`kat-${k.slug}`);
      if (el) amati.observe(el);
    });
    return () => amati.disconnect();
  }, [kategori]);

  const total = totalKeranjang(baris);
  const jumlah = jumlahItem(baris);

  function masuk(m: MenuMejaItem, opsi: MenuOption[], qty: number) {
    const k = tambah(baris, m, opsi, qty);
    if (!k) {
      toast({ tone: "warning", message: `Sisa ${m.name} tinggal ${m.available} ${m.unit_label}.` });
      return false;
    }
    setBaris(k);
    return true;
  }

  function ubah(kunci: string, qty: number) {
    const k = ubahQty(baris, kunci, qty);
    if (k) setBaris(k);
    else toast({ tone: "warning", message: "Jumlah melebihi sisa porsi." });
  }

  async function pesan(e: FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return setGalat("Isi nama pemesan agar pesanan bisa diantar ke kamu.");
    setKirim(true);
    setGalat(null);
    const r = await panggil(() => pesanDariMeja(token, {
      items: keItems(baris), customer_name: nama.trim(), customer_phone: hp || null, note: catatan.trim() || null,
    }));
    if ("error" in r) {
      setKirim(false);
      return setGalat([r.error.message, ...Object.values(r.error.fields ?? {}).flat()].join(" "));
    }
    const { code, guest_token } = r.data;
    simpanTamu(code, { tamu: guest_token, meja: token });
    simpanNama(nama.trim());
    setBaris([]);
    const b = await panggil(() => bayarPesananMeja(code, guest_token, `${window.location.origin}/meja/pesanan/${code}`));
    if ("data" in b) return window.location.assign(b.data.payment_url);
    router.push(`/meja/pesanan/${code}`); // halaman status menyediakan tombol bayar ulang
  }

  return (
    <>
      <header className="relative bg-gradient-to-br from-accent to-accent-pressed pb-9 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-start gap-4 px-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-surface ring-4 ring-surface/60">
            {toko.logo_url
              ? <Image src={toko.logo_url} alt="" fill unoptimized sizes="64px" className="object-cover" />
              : <span className="flex size-full items-center justify-center font-display text-2xl font-bold text-primary">{toko.business_name.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Pesan dari meja</p>
            <h1 className="font-display text-2xl font-bold leading-tight text-ink">{toko.business_name}</h1>
            {toko.description && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{toko.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border-2 border-dashed border-ink/70 bg-surface/90 px-3 py-1 font-mono text-sm font-bold text-ink">MEJA {meja.label}</span>
              <span className={cx("rounded-full px-3 py-1 text-sm font-semibold", toko.is_open ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}>
                {toko.is_open ? `Buka · sampai ${jamTitik(toko.close_time)}` : `Tutup · buka ${jamTitik(toko.open_time)}`}
              </span>
            </div>
          </div>
        </div>
        {/* tepi bergerigi seperti struk */}
        <div aria-hidden className="absolute inset-x-0 -bottom-px h-3"
          style={{ background: "radial-gradient(circle at 8px 0, transparent 7px, var(--color-canvas) 7.5px) 0 0 / 16px 12px repeat-x" }} />
      </header>

      {kategori.length > 1 && (
        <nav aria-label="Kategori menu" className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
          <ul className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
            {kategori.map((k) => (
              <li key={k.slug} className="shrink-0">
                <a href={`#kat-${k.slug}`} aria-current={aktifKat === k.slug ? "true" : undefined}
                  className={cx("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
                    aktifKat === k.slug ? "border-steel bg-steel text-on-steel" : "border-line bg-surface text-ink", fokus)}>
                  {k.name}<span className="font-mono text-xs opacity-70">{k.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pb-40 pt-5">
        {!toko.is_open && (
          <p role="status" className="rounded-xl bg-danger-bg px-4 py-3 text-danger">
            Toko sedang tutup. Kamu bisa melihat menu, pemesanan dibuka lagi pukul {jamTitik(toko.open_time)} WIB.
          </p>
        )}
        {kategori.length === 0 && <p className="text-center text-ink-muted">Belum ada menu yang bisa dipesan dari meja.</p>}
        {kategori.map((k) => (
          <section key={k.slug} id={`kat-${k.slug}`} aria-labelledby={`judul-${k.slug}`} className="scroll-mt-20">
            <h2 id={`judul-${k.slug}`} className="mb-3 flex items-center gap-3 font-display text-lg font-bold">
              {k.name}<span aria-hidden className="h-px flex-1 border-t-2 border-dotted border-line-strong" />
            </h2>
            <ul className="flex flex-col gap-3">
              {k.items.map((m) => (
                <KartuMenu key={m.id} m={m} qty={qtyMenu(baris, m.id)} buka={toko.is_open}
                  onTambah={() => (m.options.length ? setPilih(m) : masuk(m, [], 1))} />
              ))}
            </ul>
          </section>
        ))}
      </main>

      {jumlah > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={() => setLihat(true)}
            className={cx("mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-steel px-4 py-3 text-left text-on-steel shadow-xl", fokus)}>
            <span className="relative">
              <ShoppingBag aria-hidden className="size-6" />
              <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-ink">{jumlah}</span>
            </span>
            <span className="flex-1">
              <span className="block text-xs text-on-steel-muted">Pesanan Meja {meja.label}</span>
              <span className="font-mono text-lg font-bold" aria-live="polite">{formatRupiah(total)}</span>
            </span>
            <span className="rounded-xl bg-accent px-4 py-2 font-semibold text-ink">Lihat pesanan</span>
          </button>
        </div>
      )}

      <Dialog open={!!pilih} onClose={() => setPilih(null)} title={pilih?.name ?? ""} className={LEMBAR}>
        {pilih && <PilihOpsi menu={pilih} onTambah={(opsi, qty) => masuk(pilih, opsi, qty) && setPilih(null)} />}
      </Dialog>

      <Dialog open={lihat} onClose={() => setLihat(false)} title={`Pesanan Meja ${meja.label}`} className={LEMBAR}>
        <form onSubmit={pesan} noValidate className="flex flex-col gap-5">
          {baris.length === 0 ? (
            <p className="text-ink-muted">Pesanan masih kosong.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {baris.map((b) => (
                <li key={b.kunci} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{b.menu.name}</p>
                    {b.opsi.length > 0 && <p className="text-sm text-ink-muted">+ {b.opsi.map((o) => o.name).join(", ")}</p>}
                    <p className="font-mono text-sm">{formatRupiah(hargaSatuan(b) * b.qty)}</p>
                  </div>
                  <Stepper nilai={b.qty} label={b.menu.name} onUbah={(v) => ubah(b.kunci, v)} />
                </li>
              ))}
            </ul>
          )}
          <Field label="Nama pemesan" id="meja-nama" required help="Dipanggil saat pesanan diantar ke meja.">
            <Input value={nama} maxLength={60} autoComplete="name" onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Nomor WhatsApp (opsional)" id="meja-hp" help="Hanya bila toko perlu menghubungimu. Contoh: 081234567890">
            <Input type="tel" inputMode="numeric" autoComplete="tel" value={hp} maxLength={13} onChange={(e) => setHp(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Catatan untuk dapur (opsional)" id="meja-catatan" help={`${catatan.length}/255 karakter`}>
            <Textarea value={catatan} maxLength={255} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-subtle px-4 py-3">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-mono text-lg font-bold">{formatRupiah(total)}</span>
          </div>
          {galat && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{galat}</p>}
          <Button type="submit" size="lg" className="w-full" loading={kirim} loadingText="Membuat pesanan…" disabled={baris.length === 0}>
            Pesan &amp; bayar
          </Button>
          <p className="text-center text-xs text-ink-muted">Bayar lewat Midtrans: QRIS, GoPay, ShopeePay, atau Virtual Account. Biaya layanan (bila ada) tampil di halaman bayar.</p>
        </form>
      </Dialog>
    </>
  );
}
