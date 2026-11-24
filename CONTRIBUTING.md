# Panduan Kontribusi

## Konvensi nama

Kode memakai nama bahasa Inggris; teks untuk manusia tetap bahasa Indonesia.

| Objek                      | Aturan                                | Contoh                                                       |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Komponen React dan filenya | PascalCase                            | `AdminTable.tsx`                                             |
| Service                    | `<feature>.service.ts`                | `adminKeuanganService.ts` menjadi `admin-finance.service.ts` |
| Hook                       | `useX`, file hook mengikuti nama hook | `useKuota.ts` menjadi `useQuota.ts`                          |
| File lain                  | kebab-case                            | `action-result.ts`, `admin-level.ts`                         |
| Fungsi dan variabel        | camelCase                             | `useDeferredAction`                                          |
| Tipe dan interface         | PascalCase                            | `AdminLevel`                                                 |
| Konstanta                  | `UPPER_SNAKE`                         | `LABEL_STATUS` menjadi `STATUS_LABELS`                       |

### Yang tidak boleh diganti namanya

Dipakai aplikasi mobile, Midtrans, database, atau pengguna:

- **Kontrak HTTP:** path API, nama field JSON di request dan response (contoh `{ aktif, pesan }`), kode error (`MAINTENANCE`, `MERCHANT_CLOSED`, dan lainnya), nama header.
- **Database:** nama tabel dan kolom, isi file migrasi SQL.
- **Konfigurasi dan URL:** nama env var. Nama folder route di `fe/app` (itu URL, contoh `/pesanan`, `/pengaturan`) serta nama file khusus Next (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`, `proxy.ts`).
- **Ekspor khusus Next:** `default`, `GET`/`POST`/dan sejenisnya, `metadata`, `generateMetadata`, `config`, `dynamic`, `revalidate`.
- **Teks untuk manusia:** teks UI, pesan error ke pengguna, deskripsi `it(...)`/`describe(...)`, komentar. Semuanya tetap bahasa Indonesia, karena aturan desain proyek mewajibkan teks Indonesia dan komentar Indonesia lazim untuk tim lokal.
- **Kunci kontrak** yang dibaca pihak lain: kunci JSON API, nama field form, parameter query (`?dari=`, `?bintang=`), nama cookie, kunci dan bentuk data localStorage, serta nilai string yang tersimpan di sana. Semua properti di `types/**` mencerminkan JSON backend, jadi tetap. Properti objek **internal** (hanya dipakai di dalam kode web, tidak dikirim ke atau diterima dari luar) boleh diganti ke bahasa Inggris lewat alat rename, mis. `{ omzet, kapasitas }` menjadi `{ revenue, capacity }`.
- **Dibaca test backend:** path `lib/wa-template.ts` dan konstanta `TEMPLATE_BAWAAN` tidak di-rename, karena test backend (`merchant-orders-wa.test.ts`) membaca file itu langsung dari repo web.

## Nama yang jelas

- Tidak ada nama 1–2 huruf selain `i`/`j` untuk indeks perulangan. Parameter callback diberi nama benda yang diwakilinya
  (`orders.map((order) => …)`), `catch (e)` menjadi `catch (error)`. Kata Inggris utuh seperti `to` dan `ok` boleh.
- Singkatan ditulis kata utuh (`cfg` menjadi `config`, `ms` menjadi `durationMs`), kecuali `id`, `url`, `db`, `qty`,
  `env`, `jwt`, `csv`, `cx` (penggabung kelas CSS), dan `cta` (_call to action_, tombol ajakan utama).
- Nama boolean diawali `is`/`has`/`can` bila dibaca seperti pertanyaan (`isVisitor`, `canEdit`).
- Konstanta teks pesan untuk pengguna berakhiran `_MESSAGE` (contoh `NETWORK_ERROR_MESSAGE`).
- Nama kelas CSS di file `*.module.css` belum ikut aturan ini; menggantinya butuh pemeriksaan tampilan.

## Aturan keterangan (komentar)

Pembaca sasaran: mahasiswa yang belum pernah membaca kode ini.

- Komentar pembuka tiap file (1–3 baris): isi file dan perannya dalam alur kode web:
  - **baca data:** halaman (`app/…/page.tsx`) → `services/<fitur>.service.ts` → `services/api.ts` → backend;
  - **ubah data:** form/tombol → server action (`app/actions/*.ts`) → `services/api.ts` → backend (kadang lewat
    services).
- Setiap ekspor punya JSDoc: apa yang dilakukan, `@param` tiap parameter (prop komponen ditulis `props.nama`), dan
  `@returns`, semuanya dalam kata-kata.
- Fungsi dengan badan lebih dari ±10 baris diberi langkah bernomor (`// 1. …`, `// 2. …`) di dalam badannya. Baris JSX
  yang dikembalikan komponen tidak ikut dihitung; yang dihitung hanya logika sebelum `return`.
- Tanpa kode catatan internal (`D2`, `SY-3`, `AUD-04`, `F26`, `DB-N3`, …) di komentar, judul test (`it`/`describe`),
  maupun dokumen: tulis maksudnya dalam kalimat.
- Istilah teknis (server action, server component, JSON-LD, PWA, debounce, …) dijelaskan sekali dengan kalimat
  sederhana di file tempat istilah itu pertama muncul.
- Keterangan harus sesuai dengan yang benar-benar dilakukan kode.

## Glosarium

Wajib dipakai saat memberi nama baru. Mengikuti nama tabel DB dan peran PRD. Satu istilah satu padanan; nama variabel
lokal tidak dicatat di sini.

**toko vs store.** Entitas toko/penjual selalu **merchant** (`merchantName`, `MerchantMenu`). Kata **store** hanya
dipakai untuk status buka/tutup toko dan shell dashboard (`StoreStatus`, `StoreInfo`, `storeOpen`, `setStoreOpen`,
`StoreStatusToggle`, `app/actions/store.ts`).

**review.** Punya dua arti yang dibedakan dari konteks: ulasan pembeli (`ReviewList`, `lib/review.ts`) dan keputusan
admin setuju/tolak atas banner (`review("ditolak")` di `BannerAdmin`).

### Istilah domain

| Indonesia                | Inggris                 |
| ------------------------ | ----------------------- |
| akun                     | account                 |
| alasan                   | reason                  |
| antrean                  | queue                   |
| asisten                  | assistant               |
| bahan                    | ingredient              |
| banner toko              | merchantBanner          |
| biaya layanan            | serviceFee              |
| bintang (rating)         | stars / starRating      |
| catatan                  | note                    |
| dari / sampai (tanggal)  | from / to               |
| data master              | master                  |
| dibatalkan oleh          | cancelledBy             |
| draf                     | draft                   |
| favorit                  | favorite                |
| fitur (AI)               | feature                 |
| foto                     | photo                   |
| foto tambahan            | extraPhotos             |
| galat                    | error                   |
| gambar                   | image                   |
| hasil AI                 | aiResult                |
| jam buka                 | openHours               |
| jam server               | serverNow               |
| jenis (gambar, data)     | kind                    |
| jenis penyedia           | providerType            |
| kapasitas                | capacity                |
| kata kunci (templat)     | placeholder             |
| keluaran (AI)            | output                  |
| keranjang                | cart                    |
| keuangan                 | finance                 |
| kolom tambahan           | extraField              |
| kontak CS                | customerServiceContact  |
| kunci (penyimpanan, API) | key / apiKey            |
| kuota, stok              | quota, stock            |
| laba                     | profit                  |
| laporan                  | report                  |
| lembar cetak             | printSheet              |
| lunas                    | paid                    |
| meja                     | table                   |
| meja terakhir            | lastTable               |
| menu                     | menu                    |
| metode bayar             | paymentMethod           |
| moderasi                 | moderation              |
| nama toko                | merchantName            |
| notifikasi               | notification            |
| omzet                    | revenue                 |
| opsi, pilihan            | option                  |
| pelaku                   | actor                   |
| pemakaian                | usage                   |
| pemeliharaan             | maintenance             |
| pembeli                  | customer                |
| pemesan                  | customerName            |
| penerima (pengumuman)    | audience                |
| pencairan                | payout                  |
| pengaturan               | settings                |
| pengembalian dana        | refund                  |
| pengumuman               | announcement            |
| penyedia AI              | aiProvider              |
| pesan dari meja          | tableOrder              |
| pesanan                  | order                   |
| pesanan baru             | newOrder / isNew        |
| poin                     | point                   |
| pratinjau                | preview                 |
| prioritas                | priority                |
| referensi (transfer)     | reference               |
| rekening                 | bankAccount             |
| rekomendasi              | recommendation          |
| rentang (tanggal)        | range                   |
| ringkasan, rekap         | summary                 |
| riwayat                  | history                 |
| saldo                    | balance                 |
| sandi                    | password                |
| sandi sementara          | temporaryPassword       |
| sebaran                  | distribution            |
| sejak                    | since                   |
| sisa (waktu)             | remaining / secondsLeft |
| skenario                 | scenario                |
| status akhir             | finalStatuses           |
| stok tidak cukup         | outOfStock              |
| tahan (porsi saat bayar) | hold                    |
| tamu                     | guest                   |
| templat                  | template                |
| terlaris                 | bestSeller              |
| terpakai                 | used                    |
| tiket, keluhan           | ticket                  |
| tingkat (admin, log)     | level                   |
| titik temu               | pickupPoint             |
| toko, penjual            | merchant                |
| transaksi                | transaction             |
| ulasan                   | review                  |
| urutan                   | sortOrder               |
| verifikasi               | verification            |
| wajib ganti sandi        | forcedPasswordChange    |

### Kata kerja

| Indonesia                  | Inggris                        |
| -------------------------- | ------------------------------ |
| aktif / nonaktif (keadaan) | active / inactive              |
| aktifkan / nonaktifkan     | activate / deactivate          |
| ambil / baca               | get                            |
| balas                      | reply                          |
| bayar                      | pay                            |
| boleh (mengubah, …)        | can (`canEdit`)                |
| buat                       | create                         |
| buka / tutup               | open / close                   |
| cari                       | search                         |
| catat                      | record                         |
| cetak                      | print                          |
| daftar (benda/aksi)        | list                           |
| daftarkan                  | register                       |
| gabungkan                  | merge                          |
| ganti (QR)                 | regenerate                     |
| geser (urutan)             | move                           |
| hapus                      | delete                         |
| hitung                     | calculate / count              |
| kelola                     | manage                         |
| kirim                      | send                           |
| minta                      | request                        |
| muat                       | load                           |
| perkecil (foto)            | resize                         |
| pindai (QR)                | scan                           |
| pulihkan                   | restore                        |
| putuskan                   | decide                         |
| ringkas                    | summarize                      |
| samarkan (nama tampil)     | mask                           |
| saring                     | filter                         |
| segarkan                   | refresh                        |
| setujui / tolak            | approve / reject               |
| simpan                     | save                           |
| sisipkan                   | insert                         |
| sorot                      | highlight                      |
| tandai                     | mark                           |
| tinjau (banner)            | review                         |
| tukar                      | swap                           |
| ubah                       | update                         |
| uji (koneksi)              | test (`runTest`, `testResult`) |
| unduh                      | download                       |
| unggah                     | upload                         |

`samarkan` di web hanya menyembunyikan sebagian nama pembeli saat ditampilkan (`maskName`). Backend memakai
`anonymize` untuk hal lain: menghapus data pribadi yang tersimpan.

### Istilah UI dan teknis

| Indonesia                | Inggris                 |
| ------------------------ | ----------------------- |
| aksi                     | action                  |
| alur                     | flow                    |
| arah                     | direction               |
| bagian (halaman)         | section                 |
| bawaan                   | default                 |
| belum dilihat            | unseen                  |
| bunyi                    | beep                    |
| ditunda (aksi)           | pending / deferred      |
| disentuh (isian)         | touched                 |
| gagal muat               | loadFailed / LoadError  |
| galat umum               | generalError            |
| gelembung (pesan)        | bubble                  |
| gelombang (animasi)      | wave                    |
| grafik batang            | barChart                |
| hitung mundur            | countdown               |
| isian (form)             | input                   |
| jeda (animasi)           | pause                   |
| jeda kirim               | debounce                |
| judul / isi              | title / body            |
| kaki (struk)             | footer                  |
| kalkulator               | calculator              |
| kamera                   | camera                  |
| kartu                    | card                    |
| kembali ke               | backTo                  |
| kerangka memuat          | skeleton                |
| ketukan (cerita landing) | beat                    |
| konfirmasi               | confirmation            |
| kursor                   | cursor                  |
| langsung (live)          | live                    |
| lebar (sidebar)          | wide                    |
| lencana                  | badge                   |
| lipat / ciutkan          | collapsible / collapse  |
| masalah (isian)          | problem                 |
| mundur (setelah galat)   | backoff                 |
| muat ulang berkala       | periodicRefresh         |
| optimistis               | optimistic              |
| panel bawah (HP)         | sheet                   |
| pemicu                   | trigger                 |
| pesan (layar teks)       | message                 |
| pil (filter)             | pill                    |
| ponsel                   | mobile                  |
| putus (koneksi)          | disconnected            |
| rangka halaman           | pageFrame               |
| ringkasan galat          | errorSummary            |
| sakelar                  | toggle                  |
| sedang jeda              | coolingDown             |
| sedang menyimpan         | saving                  |
| sekarang (acuan waktu)   | now                     |
| selisih jam              | clockOffset             |
| seri (grafik)            | series                  |
| sibuk                    | busy                    |
| sumbu                    | axis / axisTicks        |
| tahap, langkah           | step                    |
| tampilan (status)        | view                    |
| tanpa sesi               | noSession               |
| terbaru                  | latest                  |
| tersaring                | filtered                |
| tujuan (tautan)          | target / href           |
| ubin                     | tile                    |
| wadah                    | container               |
| waktu lengkap / relatif  | fullTime / relativeTime |

Istilah yang belum ada di tabel: pilih padanan Inggris yang umum, lalu tambahkan ke tabel yang sesuai pada commit yang
sama.

## Alur kerja

1. **Branch.** Buat branch dari `main` dengan awalan `feat/`, `fix/`, `docs/`, `chore/`, atau `refactor/`, lalu ID fitur
   dan ringkasan kebab-case, misalnya `feat/F27-mode-pemeliharaan` atau `chore/F28-standar-kode`. Jangan commit
   langsung ke `main`.
2. **Commit.** Pakai Conventional Commits berbahasa Indonesia: `tipe(scope): deskripsi (Fxx)`. Tipe yang dipakai:
   `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`. Scope adalah area kode (`web`, `web-actions`,
   `web-root`, `test`, …). Contoh nyata: `refactor(web-actions): nama kode bahasa Inggris yang jelas (F28)`,
   `fix(web): filter bintang /ulasan rusak sejak rename W1 (F28)`. Commit kecil dan sering; satu commit satu maksud.
3. **Jangan commit rahasia.** File `.env*`, kunci API, sandi, dan token tidak boleh masuk commit (lihat `.gitignore`).
   Nama variabel env baru cukup ditambahkan ke `.env.example` tanpa nilai asli.
4. **Cek lokal sebelum push**, perintah dan urutannya sama dengan CI (`.github/workflows/ci.yml`):

   ```bash
   npm run format:check
   npm run lint
   npx tsc --noEmit
   npm run typecheck:e2e   # butuh salinan repo backend di ../be (tipe untuk e2e/)
   npm test
   BACKEND_API_URL=http://localhost:5000/api/v1 INTERNAL_API_SECRET=ci-secret-yang-panjangnya-minimal-32-karakter \
     SITE_URL=http://localhost:3000 npm run build
   ```

   Nilai env di baris `build` adalah nilai contoh yang juga dipakai CI, bukan rahasia. Test end-to-end
   (`npx playwright test`, 14 skenario, butuh MySQL lokal) tidak dijalankan CI; jalankan sebelum merge bila mengubah
   alur yang diuji e2e.

5. **Pull request** ke `main` dengan template `.github/pull_request_template.md` (ringkasan, ID fitur/issue, jenis
   perubahan, checklist, cara menguji, tangkapan layar bila tampilan berubah). CI harus hijau: `format:check` → `lint`
   → `tsc --noEmit` → `typecheck:e2e` → `test` → `build`.
6. **Review.** Minimal satu orang lain membaca dan menyetujui PR sebelum merge. Komentar review dijawab dengan commit
   baru, bukan dengan menimpa riwayat.
7. **Commit refactor dan format tidak mengubah perilaku.** Commit `refactor` dan `style` hanya mengganti nama, memindah
   file, atau merapikan format: test, teks UI, URL, dan kontrak API harus tetap sama. Bug yang ditemukan saat refactor
   diperbaiki di commit `fix` tersendiri beserta test-nya. Hash lengkap commit `refactor`/`style` ditambahkan ke
   `.git-blame-ignore-revs` supaya `git blame` menunjuk commit yang benar-benar mengubah isi. Aktifkan sekali per
   salinan repo:

   ```bash
   git config blame.ignoreRevsFile .git-blame-ignore-revs
   ```

8. **git bisect.** Enam commit tidak bisa di-build sendiri karena impornya baru diperbarui di commit berikutnya
   (empat commit pindah file, ditambah dua commit sesudah pemindahan `OrderActionParts.tsx`). Lewati keenamnya saat
   bisect:

   ```bash
   git bisect skip 21e6b70 68dacee e277ee5 93dc2f9 561bf87 6969200
   ```
