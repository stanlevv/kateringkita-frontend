# 🍱 KateringKita - Frontend Web Application

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black.svg?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3068b7.svg?logo=zod)](https://zod.dev/)
[![next-safe-action](https://img.shields.io/badge/next--safe--action-v8-purple.svg)](https://next-safe-action.dev/)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)](https://ketringkita-frontend.vercel.app)
[![Custom Domain](https://img.shields.io/badge/Domain-ketringkita.edufin.app-success.svg)](https://ketringkita.edufin.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplikasi Web Modern Manajemen Bisnis Katering **KateringKita**, dibangun menggunakan **Next.js 16 (App Router & Turbopack)**, **React 19**, **Server Actions**, **Optimistic UI**, dan terhubung langsung ke Backend REST API berbasis cloud.

[🌐 Custom Domain (Production)](https://ketringkita.edufin.app/) • [⚡ Mirror Vercel](https://ketringkita-frontend.vercel.app/) • [⚙️ Live Backend API (Heroku)](https://ketring-45f82aef1ca0.herokuapp.com/)

</div>

---

## 📌 Ringkasan Aplikasi

**KateringKita** adalah solusi digital all-in-one bagi pelaku usaha katering, UMKM kuliner, dan merchant makanan untuk mempermudah operasional dapur:
- **Katalog & Formulir CRUD Menu (Lab Pertemuan 10):** Manajemen menu dengan validasi Zod bersama (*shared schema*), proteksi Server Actions, dan antarmuka instan menggunakan React 19 `useOptimistic`.
- **Live Antrean Pesanan (POS Dashboard):** Pemantauan status pengerjaan pesanan (Dipesan, Diproses, Siap Diambil) dengan timer holding otomatis.
- **Kalkulator & Copilot HPP:** Perhitungan modal bahan, estimasi margin keuntungan per porsi, dan rekomendasi harga jual optimal.
- **Simulator WhatsApp Gateway:** Pembuatan pesan pesanan dan konfirmasi pembayaran terformat rapi untuk pelanggan.
- **Riwayat Penjualan & Ekspor CSV:** Rekapitulasi omzet dan pencetakan data penjualan dalam format spreadsheet.

---

## ✨ Fitur Teknis Lab Pertemuan 10 (Advanced Form Handling)

Proyek ini telah menerapkan seluruh standar praktikum modern Next.js:

1. **Shared Zod Schema ([`lib/schemas.ts`](lib/schemas.ts)):**
   - Satu sumber kebenaran (*single source of truth*) untuk validasi data menu baik di sisi browser (*client-side*) maupun di sisi server (*server-side*).
   - Sanitasi teks, validasi enum kategori (`Nasi Box`, `Snack`, `Minuman`, `Paket Custom`), serta pengecekan batas minimum nominal HPP dan harga jual.

2. **Per-Field Validation Error Feedback:**
   - Pesan error interaktif muncul secara presisi tepat di bawah input field yang bermasalah tanpa me-refresh halaman.

3. **Optimistic UI Updates (React 19 `useOptimistic`):**
   - Saat pengguna menambahkan menu baru atau mengubah kuota stok, perubahan langsung direfleksikan seketika pada antarmuka pengguna tanpa menunggu latency jaringan (*zero waiting lag*). Jika server gagal, state akan di-rollback secara otomatis.

4. **Type-Safe Mutation Guard ([`lib/safe-action.ts`](lib/safe-action.ts)):**
   - Mutasi data diproteksi oleh middleware `authActionClient` dari pustaka `next-safe-action`, menolak mutasi dari pengguna yang belum terautentikasi melalui verifikasi cookie HTTP.

---

## 🗂️ Struktur Direktori Proyek

```text
kateringkita-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         # Formulir login JWT
│   │   └── register/page.tsx      # Formulir pendaftaran merchant baru
│   ├── (dashboard)/
│   │   ├── copilot/page.tsx       # Kalkulator HPP & margin
│   │   ├── dashboard/page.tsx     # Live antrean pesanan & holding timer
│   │   ├── menu/page.tsx          # CRUD Menu interaktif (Lab 10 Form Handling)
│   │   ├── pengaturan/page.tsx    # Profil toko & pengaturan merchant
│   │   ├── riwayat/page.tsx       # Rekapitulasi transaksi & export CSV
│   │   └── template-wa/page.tsx   # Generator format chat WhatsApp
│   ├── actions/
│   │   └── menuActions.ts         # Server Actions Next.js (Safe Action Client)
│   ├── api/
│   │   └── menu/route.ts          # Route Handler API proxy
│   ├── layout.tsx                 # Root layout & font provider
│   └── page.tsx                   # Landing page
├── components/                    # Reusable UI widgets & modal dialogs
├── hooks/
│   └── useAuth.ts                 # Hook autentikasi & sinkronisasi token cookie
├── lib/
│   ├── axios.ts                   # Klien HTTP Axios dengan konfigurasi API Heroku
│   ├── safe-action.ts             # Client wrapper next-safe-action & auth middleware
│   ├── schemas.ts                 # Shared Zod validation schema
│   ├── store.tsx                  # Global State Context & format rupiah helper
│   └── validators.ts              # Validasi format email & nomor WhatsApp Indonesia
└── public/menu/                   # Aset gambar & ilustrasi menu katering
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
- **Node.js** `>= 20.0.0`
- **npm** `>= 10.0.0`

### 2. Instalasi
```bash
git clone https://github.com/stanlevv/kateringkita-frontend.git
cd kateringkita-frontend
npm install
```

### 3. Konfigurasi Environment Variables
Salin file template `.env.example`:
```bash
cp .env.example .env.local
```

Isi variabel environment:
```env
NEXT_PUBLIC_API_URL=https://ketring-45f82aef1ca0.herokuapp.com/api
BACKEND_API_URL=https://ketring-45f82aef1ca0.herokuapp.com/api
```
*(Catatan: Jika menjalankan backend lokal di port 5000, ubah URL menjadi `http://localhost:5000/api`)*

### 4. Menjalankan Aplikasi
```bash
# Mode Pengembangan (Hot Reload dengan Turbopack)
npm run dev

# Kompilasi Production
npm run build

# Menjalankan Server Production
npm start
```
Buka browser pada: `http://localhost:3000`

---

## 🌐 Informasi Live Deployment

- **Custom Domain:** [`https://ketringkita.edufin.app`](https://ketringkita.edufin.app)  
  *Dikonfigurasi menggunakan DNS CNAME pointing ke record Vercel Edge Network dengan sertifikat SSL otomatis.*
- **Vercel Default Host:** [`https://ketringkita-frontend.vercel.app`](https://ketringkita-frontend.vercel.app)
- **Live Backend Engine:** [`https://ketring-45f82aef1ca0.herokuapp.com/`](https://ketring-45f82aef1ca0.herokuapp.com/)

---

## 👥 Tim Pengembang

Platform **KateringKita** dikembangkan dengan dedikasi untuk efisiensi ekosistem katering lokal.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
