# 🍱 KateringKita — Merchant & Admin Web Dashboard

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-804%20Passed-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-14%20Scenarios-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)

**Web dashboard modern, responsif, dan real-time untuk mitra merchant katering serta administrator platform KateringKita.**

[Aplikasi Live Web](https://ketringkita.edufin.app) • [Mirror Vercel](https://ketringkita-frontend.vercel.app) • [Backend Repository](https://github.com/stanlevv/kateringkita-backend)

</div>

---

## 📖 Gambaran Umum

**KateringKita Frontend** adalah aplikasi web berbasis **Next.js 16 (App Router)** yang dirancang khusus untuk dua peran utama:
1. **Penjual Katering (Merchant):**
   - Pemantauan pesanan langsung (*live dashboard*) dengan sinkronisasi cerdas per 5 detik.
   - Manajemen katalog menu makanan dan penyesuaian kuota harian atomik anti *lost-update*.
   - Pemrosesan status pesanan (Konfirmasi ➔ Masak ➔ Siap Diambil ➔ Selesai) lengkap dengan fitur batalkan dalam 5 detik.
   - Generator pesan WhatsApp instan untuk komunikasi dengan pembeli mahasiswa.
   - Laporan analitik penjualan harian, mingguan, per jam, dan ekspor CSV berformat rapi.
2. **Administrator Platform:**
   - Antrean verifikasi merchant baru beserta data legalitas usaha.
   - Manajemen master data kategori makanan dan titik jemput kampus (*pickup points*).
   - Pengaturan promo platform, batas biaya layanan (*service fee*), dan audit log aktivitas.

> 💡 **Aplikasi Mobile Pembeli:** Dibangun secara terpisah dengan Flutter. Frontend web ini berkomunikasi langsung dengan [KateringKita REST API](https://github.com/stanlevv/kateringkita-backend).

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

- **Perlindungan Token JWT:** Token otentikasi disimpan di cookie `httpOnly` (`kk_session`). Kode JavaScript di sisi peramban tidak pernah memiliki akses langsung ke JWT, mencegah kerentanan XSS (*Cross-Site Scripting*).
- **Server-Side Data Fetching:** Komponen halaman mengambil data langsung dari API di tingkat server menggunakan modul layanan terisolasi (`services/merchantService.ts`, `services/adminService.ts`).
- **Route Guarding:** `proxy.ts` mengamankan rute terproteksi secara otomatis dengan mengarahkan pengguna tanpa otentikasi ke `/login?alasan=sesi-habis`.

---

## ⚡ Fitur Utama & Keunggulan Teknis

### 1. Kuota Atomik Penjual (AUD-04 / F04)
- **Anti Lost-Update:** Menggunakan hook `useKuota` terintegrasi dengan backend atomik delta.
- **Serialisasi In-Flight:** Maksimal satu request berjalan per menu secara berurutan. Mutasi tambahan selama request berlangsung diantrekan secara cerdas.
- **Operasi Campuran:** Mendukung kombinasi pengetikan input langsung (debounce 600ms) dan penekanan tombol step `+` / `-` tanpa konflik.
- **Rollback Granular & Rekonstruksi Draf:** Jika request jaringan gagal, UI memulihkan draf berdasarkan baseline server dan operasi pending pengguna tanpa menghapus perubahan baru.

### 2. Live Order Dashboard
- Sinkronisasi periodik ringan via Route Handler `/api/dashboard/sinkron?sejak=<ISO>` setiap 5 detik (30 detik jika tab tidak aktif).
- Hanya mengambil pesanan yang mengalami perubahan status, lalu digabungkan secara efisien di memori klien.
- Undo window 5 detik saat merchant menekan tombol aksi status pesanan.

### 3. Laporan & Analitik Penjualan (F09)
- Visualisasi ringkasan pendapatan kotor, pesanan selesai, dan menu terlaris.
- Grafik sebaran transaksi per jam dan riwayat pesanan interaktif.
- Fitur ekspor CSV langsung dengan encoding UTF-8 BOM untuk kompatibilitas sempurna dengan Microsoft Excel.

---

## 🗺️ Peta Halaman & Rute

| Rute | Fungsi | Akses |
|---|---|---|
| `/` | Landing page interaktif dengan demonstrasi alur pemesanan | Publik |
| `/login` & `/register` | Masuk akun & pendaftaran mitra merchant katering | Publik |
| `/lupa-sandi` | Reset kata sandi dengan kode OTP dari email | Publik |
| `/dashboard` | Live operational dashboard pesanan masuk toko | Merchant |
| `/pesanan` & `/pesanan/[code]` | Antrean dan rincian lengkap pesanan pelanggan | Merchant |
| `/menu`, `/menu/baru`, `/menu/[id]` | Manajemen katalog menu, harga, foto, dan kuota harian. Foto (≤ 20 MB) diperkecil di peramban jadi WebP ≤ 1600 px lalu diunggah langsung ke Cloudflare R2 (`lib/unggah.ts`) | Merchant |
| `/laporan` | Dasbor keuangan, tren transaksi, dan ekspor CSV | Merchant |
| `/pengaturan` | Profil toko, jam operasional, titik jemput, rekening & riwayat pencairan dana, dan pesan dari meja (sakelar, daftar meja, QR) | Merchant |
| `/cetak-qr` | Lembar QR semua meja aktif siap cetak (A4) | Merchant |
| `/template-wa` | Kustomisasi templat pesan WhatsApp otomatis | Merchant |
| `/copilot` | Kalkulator HPP (*Harga Pokok Penjualan*), saran harga, dan asisten AI toko (Gemini) | Merchant |
| `/promo` & `/ulasan` | Promo toko (kode promo checkout) dan ulasan pembeli | Merchant |
| `/admin/*` | Verifikasi merchant, master data, promo & biaya, kontak CS, dan log sistem | Admin |
| `/admin/moderasi` | Sembunyikan ulasan, turunkan menu yang melanggar | Admin |
| `/admin/tiket` & `/admin/tiket/[code]` | Tiket bantuan pembeli: tab Menunggu/Dibalas/Ditutup/Semua, cari, percakapan, balas (notifikasi ke pembeli), tutup tiket | Admin (semua tingkat, termasuk support) |
| `/admin/keuangan` | Rekap omzet, diskon, biaya layanan per toko + ekspor CSV | Admin |
| `/admin/pencairan` | Saldo non-tunai per toko, catat pencairan ke rekening toko, daftar dana yang harus dikembalikan, riwayat (F26) | Admin super |
| `/admin/pengumuman` | Kirim pengumuman ke notifikasi aplikasi | Admin |
| `/admin/ai` | Penyedia AI gratis untuk Asisten AI: urutan fallback, key (hanya bisa ditulis), uji koneksi, status | Admin |
| `/meja/[token]` | PWA pesan dari meja (dibuka QR): menu, keranjang, pesan & bayar Midtrans Snap tanpa akun | Publik |
| `/meja/pesanan/[code]` | Status pesanan meja (token tamu tersimpan di peramban) | Publik |

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
│   ├── ui/                    # Button, Input, Modal, Stepper, Table, Notification
│   ├── shell/                 # Sidebar navigasi, Header, ProfileDropdown
│   └── menu/, orders/, ...    # Komponen domain spesifik (QuotaRow, OrderCard)
hooks/                         # Custom React Hooks (useKuota, useLangsung, useNotifikasi)
services/                      # API client caller, token handling, domain services
lib/                           # Logika murni, schema validasi Zod, formatting rupiah
styles/                        # Theme tokens & custom CSS variables
test/                          # Konfigurasi pengujian Vitest & arsitektur assertions
e2e/                           # End-to-end automation test suite (Playwright)
```

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

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server pengembang Next.js di `localhost:3000` |
| `npm run build` | Melakukan build produksi Next.js |
| `npm test` | Menjalankan 804 automated unit tests menggunakan Vitest |
| `npm run lint` | Menjalankan ESLint 9 untuk memeriksa kualitas kode |
| `npx tsc --noEmit` | Memeriksa kepatuhan tipe TypeScript di seluruh proyek |
| `npx playwright test` | Menjalankan 14 skenario end-to-end testing di peramban |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
