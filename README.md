# 🍱 KateringKita — Merchant & Admin Web Dashboard

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
[![ci](https://github.com/stanlevv/kateringkita-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/stanlevv/kateringkita-frontend/actions/workflows/ci.yml)
![Playwright](https://img.shields.io/badge/Playwright-14%20Scenarios-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)

**Web dashboard modern, responsif, dan real-time untuk mitra merchant katering serta administrator platform KateringKita.**

[Aplikasi Live Web](https://ketringkita.edufin.app) • [Mirror Vercel](https://ketringkita-frontend.vercel.app) • [Backend Repository](https://github.com/stanlevv/kateringkita-backend)

</div>

---

## 📖 Gambaran Umum

**KateringKita Frontend** adalah aplikasi web berbasis **Next.js 16 (App Router)** yang dirancang khusus untuk dua peran utama:

1. **Penjual Katering (Merchant):**
   - Pemantauan pesanan langsung (_live dashboard_) dengan sinkronisasi cerdas per 5 detik.
   - Manajemen katalog menu makanan dan penyesuaian kuota harian atomik anti _lost-update_.
   - Pemrosesan status pesanan (Konfirmasi ➔ Masak ➔ Siap Diambil ➔ Selesai) lengkap dengan fitur batalkan dalam 5 detik.
   - Generator pesan WhatsApp instan untuk komunikasi dengan pembeli mahasiswa.
   - Laporan analitik penjualan harian, mingguan, per jam, dan ekspor CSV berformat rapi.
2. **Administrator Platform:**
   - Antrean verifikasi merchant baru beserta data legalitas usaha.
   - Manajemen master data kategori makanan dan titik jemput kampus (_pickup points_).
   - Pengaturan promo platform, batas biaya layanan (_service fee_), dan audit log aktivitas.
   - Moderasi ulasan & menu, rekap keuangan, pencairan dana toko dan daftar refund Midtrans.
   - Banner beranda (persetujuan pengajuan penjual) dan pop-up promo aplikasi mobile.
   - Penyedia AI dengan fallback, dasbor pemakaian AI, dan verifikasi manual hasil AI.
   - Tiket bantuan pembeli, pengumuman, kondisi server, dan akun admin bertingkat (super, ops, support).
3. **Tamu di meja (tanpa akun):** PWA `/meja` yang dibuka dari QR meja: lihat menu, pesan, bayar lewat Midtrans Snap.

> 💡 **Aplikasi Mobile Pembeli:** Dibangun secara terpisah dengan Flutter. Frontend web ini berkomunikasi langsung dengan [KateringKita REST API](https://github.com/stanlevv/kateringkita-backend). Diagram arsitektur seluruh sistem ada di [README backend](https://github.com/stanlevv/kateringkita-backend) (bagian "Arsitektur & Tumpukan Teknologi").

---

## 🔒 Arsitektur Keamanan & Aliran Data

```text
┌─────────────────┐         ┌──────────────────────────────┐         ┌─────────────────────────┐
│ Browser Client  │ ◄─────► │   Next.js 16 Server (Node)   │ ◄─────► │   Express 5 REST API    │
│  (React 19 UI)  │         │   (RSC, Actions, Handlers)   │         │ (Heroku + TiDB Cloud)   │
└─────────────────┘         └──────────────────────────────┘         └─────────────────────────┘
                                           │
                                🍪 Cookie httpOnly (kk_session)
                                   Token JWT tersimpan aman di server
```

- **Perlindungan Token JWT:** Token otentikasi disimpan di cookie `httpOnly` (`kk_session`). Kode JavaScript di sisi peramban tidak pernah memiliki akses langsung ke JWT, mencegah kerentanan XSS (_Cross-Site Scripting_).
- **Server-Side Data Fetching:** Komponen halaman mengambil data langsung dari API di tingkat server menggunakan modul layanan terisolasi (`services/<fitur>.service.ts`, mis. `services/order.service.ts` dan `services/admin-merchant.service.ts`).
- **Route Guarding:** `proxy.ts` mengamankan rute terproteksi secara otomatis dengan mengarahkan pengguna tanpa otentikasi ke `/login?alasan=sesi-habis`.

---

## ⚡ Fitur Utama & Keunggulan Teknis

### 1. Kuota Atomik Penjual

- **Anti Lost-Update:** Menggunakan hook `useQuota` terintegrasi dengan backend atomik delta.
- **Serialisasi In-Flight:** Maksimal satu request berjalan per menu secara berurutan. Mutasi tambahan selama request berlangsung diantrekan secara cerdas.
- **Operasi Campuran:** Mendukung kombinasi pengetikan input langsung (debounce 600ms) dan penekanan tombol step `+` / `-` tanpa konflik.
- **Rollback Granular & Rekonstruksi Draf:** Jika request jaringan gagal, UI memulihkan draf berdasarkan baseline server dan operasi pending pengguna tanpa menghapus perubahan baru.

### 2. Live Order Dashboard

- Sinkronisasi periodik ringan via Route Handler `/api/dashboard/sinkron?sejak=<ISO>` setiap 5 detik (30 detik jika tab tidak aktif).
- Hanya mengambil pesanan yang mengalami perubahan status, lalu digabungkan secara efisien di memori klien.
- Undo window 5 detik saat merchant menekan tombol aksi status pesanan.

### 3. Laporan & Analitik Penjualan

- Visualisasi ringkasan pendapatan kotor, pesanan selesai, dan menu terlaris.
- Grafik sebaran transaksi per jam dan riwayat pesanan interaktif.
- Fitur ekspor CSV langsung dengan encoding UTF-8 BOM untuk kompatibilitas sempurna dengan Microsoft Excel.

---

## 🗺️ Peta Halaman & Rute

| Rute                                   | Fungsi                                                                                                                                                                     | Akses                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `/`                                    | Landing page interaktif dengan demonstrasi alur pemesanan                                                                                                                  | Publik                                  |
| `/login` & `/register`                 | Masuk akun & pendaftaran mitra merchant katering                                                                                                                           | Publik                                  |
| `/lupa-sandi`                          | Reset kata sandi dengan kode OTP dari email                                                                                                                                | Publik                                  |
| `/dashboard`                           | Live operational dashboard pesanan masuk toko                                                                                                                              | Merchant                                |
| `/pesanan` & `/pesanan/[code]`         | Antrean dan rincian lengkap pesanan pelanggan                                                                                                                              | Merchant                                |
| `/menu`, `/menu/baru`, `/menu/[id]`    | Manajemen katalog menu, harga, foto, dan kuota harian. Foto (≤ 20 MB) diperkecil di peramban jadi WebP ≤ 1600 px lalu diunggah langsung ke Cloudflare R2 (`lib/upload.ts`) | Merchant                                |
| `/laporan`                             | Dasbor keuangan, tren transaksi, dan ekspor CSV                                                                                                                            | Merchant                                |
| `/pengaturan`                          | Profil toko, jam operasional, titik jemput, rekening & riwayat pencairan dana, dan pesan dari meja (sakelar, daftar meja, QR)                                              | Merchant                                |
| `/cetak-qr`                            | Lembar QR semua meja aktif siap cetak (A4)                                                                                                                                 | Merchant                                |
| `/template-wa`                         | Kustomisasi templat pesan WhatsApp otomatis                                                                                                                                | Merchant                                |
| `/copilot`                             | Kalkulator HPP (_Harga Pokok Penjualan_), saran harga, dan asisten AI toko (Gemini)                                                                                        | Merchant                                |
| `/promo` & `/ulasan`                   | Promo toko (kode promo checkout) dan ulasan pembeli                                                                                                                        | Merchant                                |
| `/banner`                              | Ajukan banner toko di beranda aplikasi pembeli, lihat status & alasan penolakan, ajukan ulang                                                                              | Merchant                                |
| `/admin/*`                             | Verifikasi merchant, master data, promo & biaya, kontak CS, dan log sistem                                                                                                 | Admin                                   |
| `/admin/moderasi`                      | Sembunyikan ulasan, turunkan menu yang melanggar                                                                                                                           | Admin                                   |
| `/admin/tiket` & `/admin/tiket/[code]` | Tiket bantuan pembeli: tab Menunggu/Dibalas/Ditutup/Semua, cari, percakapan, balas (notifikasi ke pembeli), tutup tiket                                                    | Admin (semua tingkat, termasuk support) |
| `/admin/keuangan`                      | Rekap omzet, diskon, biaya layanan per toko + ekspor CSV                                                                                                                   | Admin                                   |
| `/admin/pencairan`                     | Saldo non-tunai per toko, catat pencairan ke rekening toko, daftar dana yang harus dikembalikan, riwayat                                                                   | Admin super                             |
| `/admin/pengumuman`                    | Kirim pengumuman ke notifikasi aplikasi                                                                                                                                    | Admin                                   |
| `/admin/ai`                            | Penyedia AI gratis untuk Asisten AI: urutan fallback, key (hanya bisa ditulis), uji koneksi, status, dan dasbor pemakaian AI                                               | Admin                                   |
| `/admin/hasil-ai`                      | Verifikasi AI: setujui / tolak (dengan alasan) hasil AI yang tersimpan                                                                                                     | Admin (super & ops memutuskan)          |
| `/admin/banner` & `/admin/popup`       | Persetujuan banner penjual, banner platform, dan pop-up promo aplikasi mobile                                                                                              | Admin (super & ops mengatur)            |
| `/admin/server`                        | Kondisi backend, error 5xx, dan request lambat (log 30 hari)                                                                                                               | Admin super                             |
| `/admin/admin` & `/admin/akun`         | Kelola akun admin dan tingkat aksesnya; ganti sandi akun sendiri                                                                                                           | Admin super; semua admin                |
| `/meja/[token]`                        | PWA pesan dari meja (dibuka QR): menu, keranjang, pesan & bayar Midtrans Snap tanpa akun                                                                                   | Publik                                  |
| `/meja/pesanan/[code]`                 | Status pesanan meja (token tamu tersimpan di peramban)                                                                                                                     | Publik                                  |

**Layar kecil.** Dashboard penjual dan admin hanya untuk tablet/desktop: di bawah 768 px tampil layar "Buka di tablet atau komputer" (`template.tsx` grup). Halaman `/meja` justru dirancang untuk HP.

---

## 📁 Struktur Direktori

```text
app/
├── (auth)/                    # Autentikasi: login, registrasi merchant
├── (dashboard)/               # Halaman Merchant: dashboard, pesanan, menu, laporan, pengaturan
│   ├── dashboard/             # Live KPI & antrean pesanan real-time
│   ├── menu/                  # Katalog menu & editor kuota atomik
│   ├── pesanan/               # Rincian pesanan & komunikasi WhatsApp
│   └── laporan/               # Analitik penjualan & ekspor CSV
├── (admin)/admin/             # Halaman Admin: verifikasi, master data, audit
├── api/                       # Next.js Route Handlers (sinkronisasi live, download CSV)
├── actions/                   # Server Actions (auth, profile, menu, pesanan, admin)
├── components/                # Komponen UI modular
│   ├── ui/                    # Button, Input, Dialog, Stepper, DataTable, Toast
│   ├── shell/                 # Sidebar navigasi, Header, AccountMenu
│   └── menu/, orders/, ...    # Komponen domain spesifik (QuotaRow, OrderCard)
hooks/                         # Custom React Hooks (useQuota, useLiveDashboard, useNotifications)
services/                      # API client caller, token handling, domain services
lib/                           # Logika murni, schema validasi Zod, formatting rupiah
styles/                        # Theme tokens & custom CSS variables
test/                          # Setup Vitest, penjaga struktur (structure.test.ts) & kerangka memuat (page-skeleton.test.ts)
e2e/                           # End-to-end test Playwright (helpers.ts + spek per alur)
```

---

## 🧭 Cara membaca kode ini

Setiap fitur mengikuti dua jalur yang sama, dari layar sampai backend:

```text
baca data:  halaman (app/…/page.tsx) → services → services/api.ts → backend
ubah data:  form/tombol → server action (app/actions) → services/api.ts → backend   (kadang lewat services)
```

- **Halaman** (`page.tsx`) adalah server component: mengambil data lewat `services/<fitur>.service.ts` lalu merender komponen.
  Halaman tidak memanggil server action.
- **Server action** (`app/actions/*.ts`, ditandai `"use server"`) dipanggil dari tombol/form di browser, tetapi berjalan di server.
- **services/** memanggil REST API backend; `services/api.ts` menambahkan token sesi dari cookie `kk_session`.
- Logika murni (tanpa jaringan) ada di `lib/`, tipe data JSON backend di `types/`, hook React di `hooks/`.

Contoh penelusuran, penjual menerima pesanan:

1. `app/(dashboard)/pesanan/[code]/page.tsx` mengambil pesanan dengan `getOrder` dari `services/order.service.ts`, lalu merender `OrderDetail`.
2. Tombol **Konfirmasi** di `app/components/orders/OrderDetail.tsx` memanggil server action `orderAction(code, "confirm")` di `app/actions/orders.ts`.
3. `orderAction` memeriksa sesi penjual, lalu memanggil `merchantFetch` di `services/api.ts` → `POST /merchant/orders/:code/confirm` di backend.

Aturan nama (kode bahasa Inggris, teks untuk pengguna bahasa Indonesia) dan glosarium istilah ada di [CONTRIBUTING.md](CONTRIBUTING.md).
Sebelum push, jalankan pemeriksaan yang sama dengan CI (`.github/workflows/ci.yml`), urutannya juga sama:

```bash
npm run format:check && npm run lint && npx tsc --noEmit && npm run typecheck:e2e && npm test && npm run build
```

`typecheck:e2e` butuh salinan repo backend di folder `../be`. `build` butuh env `BACKEND_API_URL`, `INTERNAL_API_SECRET`, dan
`SITE_URL` (CI mengisinya di langkah `build` ci.yml). `BUYER_APP_URL` (opsional): alamat web aplikasi pembeli; kosong = tombol "Pesan lewat aplikasi" disembunyikan. Aturan alur kerja lengkap ada di CONTRIBUTING bagian "Alur kerja".

---

## 💻 Panduan Instalasi Lokal

### Prasyarat

- Node.js ≥ 22.12
- npm ≥ 10.x

### Langkah Menjalankan

```bash
# 1. Clone repositori
git clone https://github.com/stanlevv/kateringkita-frontend.git
cd kateringkita-frontend

# 2. Pasang dependensi
npm install

# 3. Konfigurasi environment
cp .env.example .env.local
# Pastikan BACKEND_API_URL mengarah ke backend API Anda:
# BACKEND_API_URL=http://localhost:5000/api/v1

# 4. Jalankan development server
npm run dev
# Buka http://localhost:3000 pada peramban Anda
```

---

## 🧪 Skrip & Pengujian Kualitas

| Perintah                | Deskripsi                                                 |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Menjalankan server pengembang Next.js di `localhost:3000` |
| `npm run build`         | Melakukan build produksi Next.js                          |
| `npm test`              | Menjalankan unit test Vitest (tanpa backend)              |
| `npm run format:check`  | Memeriksa format kode dengan Prettier                     |
| `npm run lint`          | Menjalankan ESLint 9 untuk memeriksa kualitas kode        |
| `npx tsc --noEmit`      | Memeriksa kepatuhan tipe TypeScript di seluruh proyek     |
| `npm run typecheck:e2e` | Memeriksa tipe test e2e (butuh repo backend di `../be`)   |
| `npx playwright test`   | Menjalankan 14 skenario end-to-end testing di peramban    |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
