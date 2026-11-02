# KateringKita — Web Penjual & Admin

Aplikasi web **KateringKita** untuk dua peran:

- **Penjual katering:** mengelola toko, menu, dan kuota porsi harian, lalu memproses pesanan mahasiswa dari dashboard live.
- **Admin platform:** memverifikasi penjual baru dan mengelola data master, promo platform, serta log.

Pembeli memakai aplikasi mobile terpisah. Web ini tidak menyimpan data sendiri; semuanya lewat [kateringkita-backend](https://github.com/stanlevv/kateringkita-backend).

| | Alamat |
|---|---|
| Production | https://ketringkita.edufin.app |
| Cadangan Vercel | https://ketringkita-frontend.vercel.app |
| API yang dipakai | https://ketring-45f82aef1ca0.herokuapp.com/api/v1 |

---

## Status per November 2026

| Halaman | Alamat | Data |
|---|---|---|
| Halaman pembuka | `/` | Statis, animasi printer struk dan alur satu pesanan |
| Masuk, daftar penjual | `/login`, `/register` | API |
| Dashboard live | `/dashboard` | API, diperbarui tiap 5 detik |
| Pesanan | `/pesanan`, `/pesanan/[kode]` | API |
| Menu & kuota | `/menu`, `/menu/baru`, `/menu/[id]` | API |
| Pengaturan toko | `/pengaturan` | API |
| Templat WhatsApp | `/template-wa` | API |
| Kalkulator HPP | `/copilot` | Dihitung di peramban |
| Laporan | `/laporan` | **Data contoh**, menunggu F09 (sedang dikerjakan) |
| Promo toko | `/promo` | **Data contoh**, menunggu F12 |
| Ulasan | `/ulasan` | **Data contoh**, menunggu F13 |
| Panel admin | `/admin`, `/admin/verifikasi`, `/admin/penjual`, `/admin/data-master`, `/admin/promo`, `/admin/log` | API |
| Pratinjau keadaan | `/pratinjau` | Hanya mode pengembangan: memicu keadaan seperti kosong, gagal muat, dan pesanan baru |

Selama masih ada halaman berdata contoh, area penjual menampilkan banner "Sebagian halaman masih memakai data contoh." Uji otomatis: **90 berkas, 764 test**, semuanya lulus.

---

## Teknologi

| Bagian | Pilihan |
|---|---|
| Framework | Next.js 16.3 (App Router, Server Components, Server Actions, Route Handlers) |
| UI | React 19.2, Tailwind CSS 4, ikon `lucide-react` |
| Bahasa | TypeScript 5 |
| Validasi form | Zod 4 (aturan sama dengan backend) |
| Font | Inter, Plus Jakarta Sans, JetBrains Mono, Bricolage Grotesque lewat `next/font` |
| Uji | Vitest 5, Testing Library, jsdom; lint dengan ESLint 9 |
| Hosting | Vercel |

Dependency produksi hanya lima: `next`, `react`, `react-dom`, `zod`, `lucide-react`.

---

## Cara kerja

```text
Peramban ──► Next.js di Vercel ──────────────► API Express di Heroku ──► TiDB Cloud
             (Server Components,   token JWT
              Server Actions,      dari cookie
              Route Handlers)      httpOnly
```

- **Token tidak pernah sampai ke JavaScript peramban.** Saat masuk, Server Action menyimpan token di cookie `httpOnly` bernama `kk_session`. Setiap panggilan ke API dilakukan di server Next (`lib/merchant-api.ts`, `lib/admin/api.ts`).
- **Penjaga halaman.** `proxy.ts` mengarahkan pengunjung tanpa sesi ke `/login`. Setiap halaman juga memeriksa peran (`requireMerchant()` / admin) di server.
- **Dashboard live.** Klien memanggil Route Handler `/dashboard/sinkron?sejak=` setiap 5 detik (30 detik bila tab tersembunyi). Respons hanya berisi pesanan yang berubah, lalu digabung per kode pesanan. KPI di dashboard dihitung dari data yang sama dengan antrean.
- **Aksi pesanan** (konfirmasi, masak, siap, selesai, tolak) dijalankan lewat Server Action, dengan jendela 5 detik untuk membatalkan sebelum terkirim.
- **Unggah foto** langsung dari peramban ke Cloudflare R2 memakai URL bertanda tangan dari backend (`lib/unggah.ts`). Fitur ini aktif setelah R2 diatur di backend.
- **Ekspor CSV laporan** dibuat oleh Route Handler `/laporan/csv`, dengan BOM agar terbaca benar di Excel.

---

## Struktur folder

```text
app/
├── page.tsx               Halaman pembuka
├── (auth)/                login, register
├── (dashboard)/           Halaman penjual + Route Handler (dashboard/sinkron, laporan/csv, pesanan/[code]/wa)
├── (admin)/admin/         Halaman admin
└── actions/               Server Actions (auth, akun, toko, profil, menu, pesanan, promo, admin)
components/
├── ui/                    Komponen dasar: tombol, input, dialog, tabel, kartu KPI, unggah berkas
├── shell/                 Sidebar, kepala halaman, navigasi
├── landing/               Printer struk dan alur pesanan di halaman pembuka
└── dashboard, orders, menu, reports, promo, reviews, settings, wa, hpp, admin
lib/
├── data/                  Pembacaan data per halaman (memanggil API)
├── merchant-api.ts        Klien API penjual (token dari cookie)
├── session.ts             Sesi, requireMerchant()
├── schemas.ts             Aturan validasi form
├── format.ts              Rupiah, tanggal dan jam WIB
└── dashboard.ts, laporan.ts, order-status.ts, …   Logika murni yang diuji
proxy.ts                   Pengalihan ke /login untuk halaman yang butuh sesi
```

Warna dan ukuran memakai token di `app/globals.css` (misalnya `bg-accent`, `text-ink-muted`), bukan kelas Tailwind mentah. Semua teks berbahasa Indonesia.

---

## Menjalankan di komputer sendiri

Prasyarat: Node.js ≥ 22 dan backend yang sedang berjalan (lokal atau production).

```bash
git clone https://github.com/stanlevv/kateringkita-frontend.git
cd kateringkita-frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

| Variabel | Wajib | Keterangan |
|---|---|---|
| `BACKEND_API_URL` | ya | Alamat API termasuk `/api/v1`, misalnya `http://localhost:5000/api/v1` |
| `INTERNAL_API_SECRET` | tidak | Sama dengan nilai di backend, minimal 32 karakter |

Tidak ada variabel `NEXT_PUBLIC_*`: alamat API dan token hanya dipakai di server.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` lalu `npm start` | Build production lalu jalankan |
| `npm test` | Seluruh uji Vitest |
| `npm run lint` | ESLint |

---

## Deploy

Project Vercel `ketringkita-frontend` tersambung ke repo ini. Setiap push ke `main` otomatis di-build dan dipasang ke `ketringkita.edufin.app`. Variabel `BACKEND_API_URL` diatur di Vercel → Settings → Environment Variables.

---

## Lisensi

[MIT](LICENSE)
