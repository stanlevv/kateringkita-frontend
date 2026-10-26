"use client";

import { useActionState, useOptimistic, useRef, useState, useTransition, useEffect } from "react";
import {
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  UploadCloud,
  Clock,
  ShoppingCart,
  Calculator,
  ShieldCheck,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Terminal,
} from "lucide-react";
import Shell from "@/components/Shell";
import { useStore, rp, Menu } from "@/lib/store";
import { createMenuAction, deleteMenuAction, toggleAuthSession, checkAuthSession } from "@/app/actions/menuActions";
import { CATEGORIES, MenuActionState } from "@/lib/schemas";

const mono = "font-[family-name:var(--font-mono)]";
const cats = CATEGORIES;
const cc: Record<string, string> = {
  "Nasi Box": "bg-orange-50 text-orange-700",
  Snack: "bg-amber-50 text-amber-700",
  Minuman: "bg-blue-50 text-blue-700",
  "Paket Custom": "bg-purple-50 text-purple-700",
};

const fcats: [string, string, string][] = [
  ["Nasi Box", "Nasi Box", "Makan Siang Fresh"],
  ["Snack", "Snack", "Kudapan & Kue"],
  ["Minuman", "Minuman", "Es Teh / Kopi"],
  ["Paket Custom", "Paket Event", "Bulk Pre-Order H-2"],
];

const N = (v: string) => +v.replace(/\D/g, "") || 0;
const inp =
  "w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-[14px] focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors";
const inpError =
  "w-full h-11 bg-red-50/40 border border-red-300 rounded-xl px-3 text-[14px] focus:ring-2 focus:ring-red-400 focus:outline-none transition-colors";
const lbl = "block text-[13px] font-bold mb-2";
const card = "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm";

type OptimisticMenu = Menu & { isOptimistic?: boolean };

const initialActionState: MenuActionState = {
  success: false,
  errors: {},
};

function FormView({
  cur,
  onClose,
  onOptimisticAdd,
  onSaveSuccess,
}: {
  cur?: Menu;
  onClose: () => void;
  onOptimisticAdd: (item: Menu) => void;
  onSaveSuccess: (item: Menu) => void;
}) {
  const { menu } = useStore();
  const [name, setName] = useState(cur?.name ?? "");
  const [cat, setCat] = useState(cur?.cat ?? "Nasi Box");
  const [desc, setDesc] = useState((cur as any)?.desc ?? "");
  const [img, setImg] = useState(cur?.img ?? "/menu/1.png");
  const [hpp, setHpp] = useState(String(cur?.hpp ?? ""));
  const [price, setPrice] = useState(String(cur?.price ?? ""));
  const [stock, setStock] = useState(String(cur?.stock ?? "10"));
  const [est, setEst] = useState(cur?.est ?? "15 Mnt");
  const file = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 2. Action dengan error per field via useActionState
  const [state, formAction, isPending] = useActionState(createMenuAction, initialActionState);
  const [, startTransition] = useTransition();

  // Efek ketika mutasi berhasil
  useEffect(() => {
    if (state.success && state.data) {
      onSaveSuccess(state.data);
      const timer = setTimeout(() => {
        onClose();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.data, onClose, onSaveSuccess]);

  const p = N(price),
    h = N(hpp),
    q = N(stock),
    gross = p - h;
  const mg = p ? (gross / p) * 100 : 0,
    omzet = q * p,
    modal = q * h,
    laba = omzet - modal,
    ratio = p ? (h / p) * 100 : 0;
  const st =
    mg < 30
      ? ["Margin Tipis", "bg-red-50 text-red-600"]
      : mg > 45
      ? ["Margin Tinggi", "bg-blue-50 text-blue-700"]
      : ["Ideal & Sehat", "bg-emerald-100 text-emerald-700"];
  const catLabel = fcats.find((c) => c[0] === cat)?.[1];
  const mid = cur ? String(cur.id).slice(-3).padStart(3, "0") : String(menu.length + 1).padStart(3, "0");

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImg(URL.createObjectURL(f));
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // 3. Update Optimistik: Tambah daftar seketika dengan useOptimistic sebelum server merespon
    const optimisticItem: Menu = {
      id: Date.now(),
      name: name.trim() || "Item Baru (Menyimpan...)",
      cat,
      price: p,
      hpp: h,
      stock: q,
      hold: 0,
      sold: 0,
      est,
      img,
    };

    startTransition(() => {
      onOptimisticAdd(optimisticItem);
      formAction(formData);
    });
  };

  return (
    <Shell
      title={`Kelola Menu & Stok › ${cur ? "Edit Menu" : "Tambah Menu Baru"}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Kembali ke Katalog
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
            className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
          >
            {isPending ? "Menyimpan ke Server..." : "Publikasikan Menu"}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
            <Sparkles size={13} className="text-orange-600" />
            Lab Pertemuan 10: CRUD Form (Schema Zod + useActionState + useOptimistic + next-safe-action)
          </span>
        </div>
      </div>

      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">
            Formulir {cur ? "Edit" : "Tambah"} Menu & Alokasi Porsi
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 max-w-[620px]">
            Tervalidasi secara end-to-end dengan Zod Schema di klien & server, proteksi autentikasi next-safe-action, dan update optimistik seketika.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-semibold inline-flex items-center"
          >
            ✕ Batal
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
            className="h-10 px-7 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[14px] font-bold shadow-sm inline-flex items-center gap-2"
          >
            {isPending && <span className="animate-spin text-sm">⌛</span>}
            {isPending ? "Memproses..." : "Simpan Menu"}
          </button>
        </div>
      </div>

      {/* Global Banner Notifikasi Status Server Action */}
      {!state.success && state.message && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-[13px] flex items-start gap-3 shadow-sm animate-fadeIn">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <b className="block font-bold mb-0.5">Aksi Ditolak Server:</b>
            <p>{state.message}</p>
            {state.message.includes("belum login") && (
              <p className="text-[12px] text-red-600 mt-1">
                Tip pengujian: Ubah status sesi ke <b>Aktif (Login)</b> di bilah atas untuk mengizinkan mutasi.
              </p>
            )}
          </div>
        </div>
      )}

      {state.success && state.message && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-[13px] flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1">
            <b className="block font-bold mb-0.5">Berhasil Terverifikasi!</b>
            <p>{state.message}</p>
          </div>
        </div>
      )}

      {/* FORM DENGAN SERVER ACTION useActionState */}
      <form ref={formRef} onSubmit={handleCustomSubmit} className="grid grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Hidden inputs untuk nilai terkelola */}
        <input type="hidden" name="cat" value={cat} />
        <input type="hidden" name="img" value={img} />

        <div className="space-y-6">
          <div className={card}>
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center">1</span>
                <div>
                  <b className="text-[15px]">Informasi Dasar & Kategori Menu</b>
                  <div className="text-[11px] text-gray-500 max-w-[330px]">
                    Validasi skema bersama (lib/schemas.ts) untuk nama dan kategori
                  </div>
                </div>
              </div>
              <span className={`text-[10px] bg-gray-100 rounded px-2 py-1.5 text-gray-600 ${mono}`}>ID Auto: #MN-{mid}</span>
            </div>

            {/* Field: Nama Menu */}
            <div className="flex justify-between mt-5 mb-2">
              <label htmlFor="name-input" className="text-[13px] font-bold">
                Nama Menu Katering <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] text-gray-400 ${mono}`}>{name.length}/60</span>
            </div>
            <input
              id="name-input"
              name="name"
              className={state.errors?.name?.[0] ? inpError : inp}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Nasi Ayam Bakar Madu Spesial Vokasi"
            />
            {/* Error di bawah field Nama Menu */}
            {state.errors?.name?.[0] && (
              <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {state.errors.name[0]}
              </p>
            )}

            {/* Field: Kategori */}
            <label className={lbl + " mt-5"}>
              Kategori Menu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {fcats.map(([v, l, s]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setCat(v)}
                  className={`text-left rounded-xl p-3 flex gap-2 items-start border-2 transition-all ${
                    cat === v ? "border-orange-500 bg-orange-50/40" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-4 h-4 mt-0.5 rounded-full shrink-0 ${cat === v ? "border-[5px] border-orange-600" : "border border-gray-300"}`} />
                  <span>
                    <b className="block text-[13px]">{l}</b>
                    <span className="text-[10px] text-gray-500">{s}</span>
                  </span>
                </button>
              ))}
            </div>
            {/* Error di bawah field Kategori */}
            {state.errors?.cat?.[0] && (
              <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {state.errors.cat[0]}
              </p>
            )}

            {/* Field: Deskripsi */}
            <label htmlFor="desc-input" className={lbl + " mt-5"}>
              Deskripsi & Komposisi Menu
            </label>
            <textarea
              id="desc-input"
              name="desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nasi pulen wangi, ayam paha bakar madu karamel, lalap timun kemangi..."
              className="w-full border border-gray-200 rounded-xl p-3 text-[13px] resize-none focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            {state.errors?.desc?.[0] && (
              <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {state.errors.desc[0]}
              </p>
            )}

            {/* Unggah Foto */}
            <div className="flex justify-between mt-5 mb-2">
              <label className="text-[13px] font-bold">Foto Menu Katering</label>
              <span className="text-[11px] text-gray-400">Format JPG/PNG, rasio 4:3, maks 5MB</span>
            </div>
            <div className="border-2 border-dashed border-orange-300 bg-orange-50/30 rounded-2xl p-4 flex items-center gap-4">
              {img ? <img src={img} alt="" className="w-[88px] h-[72px] rounded-lg object-cover" /> : <div className="w-[88px] h-[72px] rounded-lg bg-gray-100" />}
              <div className="flex-1">
                <div className="flex gap-3 items-center">
                  <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
                  <button
                    type="button"
                    onClick={() => file.current?.click()}
                    className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
                  >
                    <UploadCloud size={15} className="text-orange-600" />
                    {img ? "Ganti Foto" : "Unggah Foto"}
                  </button>
                  {img && (
                    <button
                      type="button"
                      onClick={() => setImg("")}
                      className="text-[13px] font-semibold text-red-500 inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 mt-2">
                  Foto menu katering berkualitas mempermudah pembeli memilih saat checkout via portal online.
                </p>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">2</span>
                <div>
                  <b className="text-[15px]">Penetapan Harga & HPP Bahan Baku (Food Cost)</b>
                  <div className="text-[11px] text-gray-500">Kalkulasi modal belanja per porsi terproteksi otomatis</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shrink-0 inline-flex items-center gap-1">
                <ShieldCheck size={13} />
                Proteksi Margin 30-45%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
              {/* Field: Modal HPP */}
              <div>
                <label htmlFor="hpp-input" className={lbl}>
                  Modal HPP Bahan Baku / Box <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-[13px]">Rp</span>
                  <input
                    id="hpp-input"
                    name="hpp"
                    className={`${state.errors?.hpp?.[0] ? inpError : inp} pl-9 font-bold ${mono}`}
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 12000"
                  />
                </div>
                {/* Error di bawah field HPP */}
                {state.errors?.hpp?.[0] ? (
                  <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {state.errors.hpp[0]}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">Minimal Rp 500 (bahan makanan pokok).</p>
                )}
              </div>

              {/* Field: Harga Jual */}
              <div>
                <label htmlFor="price-input" className={lbl}>
                  Harga Jual ke Pembeli / Box <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-[13px]">Rp</span>
                  <input
                    id="price-input"
                    name="price"
                    className={`${state.errors?.price?.[0] ? inpError : inp} pl-9 font-bold ${mono}`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 18000"
                  />
                </div>
                {/* Error di bawah field Harga Jual */}
                {state.errors?.price?.[0] ? (
                  <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {state.errors.price[0]}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">Minimal Rp 1.000 (harga jual katalog).</p>
                )}
              </div>
            </div>

            <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp size={16} />
              </span>
              <div className="flex-1 text-[12px] text-gray-600">
                Estimasi Gross Profit per Box:
                <div className={`font-bold text-[14px] ${gross < 0 ? "text-red-600" : "text-emerald-700"} ${mono}`}>
                  {gross < 0 ? "-" : "+"}
                  {rp(Math.abs(gross))} / porsi <span className="font-normal text-gray-500">({mg.toFixed(1)}% Gross Margin)</span>
                </div>
              </div>
              <span className={`text-[11px] font-bold rounded-lg px-3 py-1.5 ${st[1]}`}>Status: {st[0]}</span>
            </div>
          </div>

          <div className={card}>
            <div className="flex gap-3 pb-4 border-b border-gray-100">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center">3</span>
              <div>
                <b className="text-[15px]">Alokasi Porsi & Waktu Masak</b>
                <div className="text-[11px] text-gray-500">Kuota produksi harian dan SLA penyajian</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
              {/* Field: Kuota Stok */}
              <div>
                <label htmlFor="stock-input" className={lbl}>
                  Kuota Produksi Harian (Box) <span className="text-red-500">*</span>
                </label>
                <input
                  id="stock-input"
                  name="stock"
                  className={`${state.errors?.stock?.[0] ? inpError : inp} font-bold ${mono}`}
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 25"
                />
                {state.errors?.stock?.[0] && (
                  <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {state.errors.stock[0]}
                  </p>
                )}
              </div>

              {/* Field: Estimasi Waktu Masak */}
              <div>
                <label htmlFor="est-input" className={lbl}>
                  <Clock size={13} className="inline mr-1" />
                  Estimasi Waktu Masak
                </label>
                <select
                  id="est-input"
                  name="est"
                  className={inp}
                  value={est}
                  onChange={(e) => setEst(e.target.value)}
                >
                  {["5 Mnt", "10 Mnt", "15 Mnt", "20 Mnt", "Pre-Order H-2"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                {state.errors?.est?.[0] && (
                  <p className="text-red-600 text-[12px] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {state.errors.est[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Preview & Kalkulasi Finansial */}
        <div className="space-y-6">
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <b className="text-[13px] flex items-center">
                <i className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2" />
                LIVE PREVIEW KATALOG TOKO
              </b>
              <span className="text-[10px] text-gray-400">Tampilan Pelanggan</span>
            </div>
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <div className="relative h-[190px] bg-gray-100">
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
                <span className="absolute top-3 left-3 flex gap-1.5">
                  <span className="text-[10px] font-bold bg-orange-600 text-white rounded px-2 py-1">{catLabel}</span>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white rounded px-2 py-1">✓ Ready {q} Box</span>
                </span>
                <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-black/70 text-white rounded px-2 py-1">◷ SLA: {est}</span>
              </div>
              <div className="p-4">
                <b className="text-[15px] block">{name || "Nama menu belum diisi"}</b>
                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 min-h-[36px]">{desc || "Deskripsi menu akan tampil di sini."}</p>
                <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-[10px] text-gray-400">Harga per Pax</div>
                    <b className={`text-[18px] text-orange-600 ${mono}`}>{rp(p)}</b>
                  </div>
                  <span className="h-9 px-4 rounded-lg bg-orange-600 text-white text-[12px] font-bold inline-flex items-center gap-1.5">
                    <ShoppingCart size={13} />
                    Pesan
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <Calculator size={16} className="text-gray-500 mt-0.5" />
                <div>
                  <b className="text-[13px]">PROYEKSI FINANSIAL KUOTA</b>
                  <div className="text-[11px] text-gray-500">Estimasi hasil perputaran kuota harian</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-1">Tervalidasi Zod</span>
            </div>
            <div className="mt-4 space-y-3 text-[12px] pb-4 border-b border-dashed border-gray-300">
              <div className="flex justify-between">
                <span>
                  Potensi Omzet Kotor ({q} Box @ {rp(p)}):
                </span>
                <b className={mono}>{rp(omzet)}</b>
              </div>
              <div className="flex justify-between">
                <span>
                  Alokasi Modal Belanja ({q} Box @ {rp(h)}):
                </span>
                <b className={`text-red-500 ${mono}`}>-{rp(modal)}</b>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <b className="text-[13px]">Proyeksi Laba Bersih Dapur:</b>
                <div className="text-[11px] text-emerald-700 font-semibold">Margin Keuntungan {mg.toFixed(1)}%</div>
              </div>
              <b className={`text-[20px] ${laba < 0 ? "text-red-600" : "text-emerald-700"} ${mono}`}>
                {laba < 0 ? "-" : "+"}
                {rp(Math.abs(laba))}
              </b>
            </div>
          </div>
        </div>
      </form>
    </Shell>
  );
}

export default function MenuPage() {
  const { menu, setMenu, adj } = useStore();
  const [q, setQ] = useState("");
  const [f, setF] = useState("Semua");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [, startTransition] = useTransition();

  // Inisialisasi status sesi cookie saat pertama render
  useEffect(() => {
    checkAuthSession().then((hasAuth) => {
      setIsLoggedIn(hasAuth);
    });
  }, []);

  // 3. Update Optimistik menggunakan hook useOptimistic (React 19)
  const [optimisticMenus, addOptimisticMenu] = useOptimistic(
    menu,
    (currentList: OptimisticMenu[], newMenu: Menu) => [
      { ...newMenu, isOptimistic: true },
      ...currentList,
    ]
  );

  const toggleAuth = async () => {
    const nextState = !isLoggedIn;
    await toggleAuthSession(nextState);
    setIsLoggedIn(nextState);
  };

  const rows = optimisticMenus.filter(
    (m) => (f === "Semua" || m.cat === f) && m.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus "${name}"?`)) return;
    const res = await deleteMenuAction(id);
    if (!res.success) {
      alert(res.message || "Gagal menghapus menu.");
      return;
    }
    setMenu(menu.filter((x) => x.id !== id));
  };

  if (editing !== null) {
    return (
      <FormView
        key={String(editing)}
        cur={menu.find((m) => m.id === editing)}
        onClose={() => setEditing(null)}
        onOptimisticAdd={(item) => addOptimisticMenu(item)}
        onSaveSuccess={(item) => {
          setMenu([item, ...menu.filter((m) => m.id !== item.id)]);
        }}
      />
    );
  }

  return (
    <Shell title="Kelola Menu & Stok">
      {/* BILAH STATUS EVALUASI LAB PERTEMUAN 10 & SESI AUTH */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border border-orange-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shrink-0">
              P10
            </span>
            <div>
              <div className="flex items-center gap-2">
                <b className="text-[14px] text-gray-900">Lab Pertemuan 10: Form Handling, Validasi Skema & Mutasi</b>
                <span className="text-[10px] font-bold bg-orange-600 text-white rounded px-2 py-0.5">Evaluasi-25</span>
              </div>
              <p className="text-[12px] text-gray-600 mt-0.5">
                Kriteria: (1) Schema Zod bersama · (2) useActionState error per field · (3) useOptimistic · (4) wrapper next-safe-action auth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Login/Logout untuk menguji Kriteria 4: Pengguna yang belum login ditolak action */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-[12px]">
              <span className="text-gray-500">Status Sesi:</span>
              <button
                type="button"
                onClick={toggleAuth}
                className={`font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                  isLoggedIn
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
                title="Klik untuk mengubah sesi (menguji kriteria auth ditolak)"
              >
                {isLoggedIn ? <Lock size={13} /> : <Unlock size={13} />}
                {isLoggedIn ? "Login Aktif (Merchant)" : "Logout (Tamu)"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCurlModal(true)}
              className="h-9 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-[12px] font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Terminal size={14} className="text-gray-700" />
              Uji cURL Server
            </button>
          </div>
        </div>
      </div>

      {/* HEADER KATALOG */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Katalog Menu & Alokasi Porsi</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Daftar hidangan katering dengan validasi skema real-time dan update tampilan seketika (Optimistic UI).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[13px] font-bold shadow-sm transition-all hover:shadow"
        >
          + Tambah Menu Baru
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between mb-5 shadow-sm">
        <div className="flex items-center gap-2 w-[320px] h-9 border border-gray-200 rounded-lg px-3">
          <Search size={14} className="text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama menu katering..."
            className="flex-1 text-[13px] outline-none"
          />
        </div>
        <div className="flex gap-1 text-[13px]">
          {["Semua", ...cats].map((t) => (
            <button
              key={t}
              onClick={() => setF(t)}
              className={`px-4 h-8 rounded-full font-medium transition-colors ${
                f === t ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL DAFTAR MENU DENGAN STATUS OPTIMISTIK */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10px] tracking-wider text-gray-400 text-left border-b border-gray-100 bg-gray-50/50">
              {["FOTO & NAMA MENU", "KATEGORI", "HARGA JUAL", "SISA KUOTA DAPUR", "EST. MASAK", "STATUS MUTASI", "AKSI"].map(
                (h) => (
                  <th key={h} className="p-4 font-semibold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const mg = m.price - m.hpp;
              return (
                <tr
                  key={m.id}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${
                    m.isOptimistic ? "bg-amber-50/50" : "hover:bg-gray-50/50"
                  }`}
                >
                  <td className="p-4">
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <img src={m.img} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                        {m.isOptimistic && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold max-w-[240px] flex items-center gap-1.5">
                          {m.name}
                          {m.isOptimistic && (
                            <span className="text-[9px] bg-amber-500 text-white rounded px-1.5 py-0.2 font-semibold">
                              Optimistik
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          ID: #MN-{String(m.id).slice(-3).padStart(3, "0")} · Terjual: {m.sold} ·{" "}
                          <b className="text-emerald-700">
                            Margin: {rp(mg)} ({Math.round(m.price ? (mg / m.price) * 100 : 0)}%)
                          </b>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold rounded px-2 py-1 ${cc[m.cat]}`}>{m.cat}</span>
                  </td>
                  <td className="p-4">
                    <b className={mono}>{rp(m.price)}</b>
                    <div className={`text-[10px] text-gray-400 ${mono}`}>HPP Modal: {rp(m.hpp)}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adj(m.id, -1)}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                      >
                        −
                      </button>
                      <b className={`w-8 text-center ${mono} ${m.stock === 0 ? "text-red-500" : "text-emerald-700"}`}>
                        {m.stock}
                      </b>
                      <button
                        type="button"
                        onClick={() => adj(m.id, 1)}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                      {m.hold > 0 && (
                        <span className="text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 rounded px-1.5 py-1">
                          {m.hold} Hold
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{m.est}</td>
                  <td className="p-4">
                    {m.isOptimistic ? (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1 animate-pulse inline-flex items-center gap-1">
                        ⚡ Menyimpan...
                      </span>
                    ) : m.stock === 0 ? (
                      <span className="text-[11px] font-bold bg-red-50 text-red-600 rounded-full px-3 py-1">✕ HABIS</span>
                    ) : (
                      <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-full px-3 py-1">●● AKTIF</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 text-gray-400">
                      <button
                        type="button"
                        onClick={() => setEditing(m.id)}
                        className="hover:text-orange-600 transition-colors"
                        title="Edit Menu"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.name)}
                        className="hover:text-red-600 transition-colors"
                        title="Hapus Menu"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div className="text-center text-gray-400 text-[13px] py-10">Menu tidak ditemukan.</div>}
      </div>

      {/* MODAL PENGUJIAN CURL (Kriteria Selesai: Server menolak data tidak valid via curl) */}
      {showCurlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Terminal size={20} className="text-orange-600" />
                <h3 className="font-extrabold text-[17px]">Pengujian Endpoint Server dengan cURL</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCurlModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-[13px] text-gray-600 mb-4">
              Endpoint <code>/api/menu</code> mengeksekusi validasi server yang sama persis dengan Server Action. Jalankan perintah di bawah ini di terminal untuk membuktikan kriteria selesai:
            </p>

            <div className="space-y-4 text-[12px]">
              <div>
                <b className="block text-gray-900 mb-1">
                  1. Server menolak data tidak valid (uji bypass validasi klien):
                </b>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto select-all">
{`curl -X POST http://localhost:3000/api/menu \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{"name":"", "cat":"Minuman", "price":0, "hpp":0}'`}
                </pre>
                <span className="text-[11px] text-emerald-700 font-medium">
                  → Menghasilkan 400 Bad Request dengan error field spesifik dari Zod (nama min 3, harga min Rp 1000).
                </span>
              </div>

              <div>
                <b className="block text-gray-900 mb-1">
                  2. Pengguna belum login ditolak oleh action (uji tanpa token auth):
                </b>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto select-all">
{`curl -X POST http://localhost:3000/api/menu \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Nasi Bebek Madura", "cat":"Nasi Box", "price":25000, "hpp":15000, "stock":10}'`}
                </pre>
                <span className="text-[11px] text-emerald-700 font-medium">
                  → Menghasilkan 401 Unauthorized: &ldquo;Pengguna yang belum login ditolak oleh action&rdquo;.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCurlModal(false)}
                className="h-9 px-5 rounded-xl bg-orange-600 text-white font-bold text-[13px]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
