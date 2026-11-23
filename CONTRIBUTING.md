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
- **Teks untuk manusia:** teks UI, pesan error ke pengguna, deskripsi `it(...)`/`describe(...)`, komentar. Semuanya tetap bahasa Indonesia, karena aturan proyek DS-09 mewajibkan teks Indonesia dan komentar Indonesia lazim untuk tim lokal.
- **Kunci kontrak** yang dibaca pihak lain: kunci JSON API, nama field form, parameter query (`?dari=`, `?bintang=`), nama cookie, kunci dan bentuk data localStorage, serta nilai string yang tersimpan di sana. Semua properti di `types/**` mencerminkan JSON backend, jadi tetap. Properti objek **internal** (hanya dipakai di dalam kode web, tidak dikirim ke atau diterima dari luar) boleh diganti ke bahasa Inggris lewat alat rename, mis. `{ omzet, kapasitas }` menjadi `{ revenue, capacity }`.
- **Dibaca test backend:** path `lib/wa-template.ts` dan konstanta `TEMPLATE_BAWAAN` tidak di-rename, karena test backend (`merchant-orders-wa.test.ts`) membaca file itu langsung dari repo web.

## Glosarium

Wajib dipakai saat memberi nama baru. Mengikuti nama tabel DB dan peran PRD.

| Indonesia              | Inggris                | Indonesia              | Inggris                 |
| ---------------------- | ---------------------- | ---------------------- | ----------------------- |
| pesanan                | order                  | ambil / baca           | get                     |
| toko, penjual          | merchant               | daftar (benda/aksi)    | list                    |
| pembeli                | customer               | buat                   | create                  |
| menu                   | menu                   | ubah                   | update                  |
| kuota, stok            | quota, stock           | hapus                  | delete                  |
| ulasan                 | review                 | simpan                 | save                    |
| laporan                | report                 | tandai                 | mark                    |
| unggah                 | upload                 | bayar                  | pay                     |
| pencairan              | payout                 | kunci                  | lock                    |
| rekening               | bankAccount            | segarkan               | refresh                 |
| meja                   | table                  | setujui / tolak        | approve / reject        |
| titik temu             | pickupPoint            | aktif / nonaktif       | active / inactive       |
| keranjang              | cart                   | buka / tutup           | open / close            |
| kadaluarsa             | expired / expiry       | kirim                  | send                    |
| favorit                | favorite               | cari                   | search                  |
| tiket, keluhan         | ticket                 | hitung                 | calculate / count       |
| notifikasi             | notification           | pulihkan               | restore                 |
| pemeliharaan           | maintenance            | sandi                  | password                |
| pengumuman             | announcement           | akun                   | account                 |
| moderasi               | moderation             | pengaturan             | settings                |
| keuangan               | finance                | ringkasan              | summary                 |
| asisten                | assistant              | galat                  | error                   |
| rekomendasi            | recommendation         | halaman                | page                    |
| hasil AI               | aiResult               | biaya layanan          | serviceFee              |
| tamu                   | guest                  | omzet                  | revenue                 |
| skenario               | scenario               | kapasitas              | capacity                |
| bahan                  | ingredient             | terlaris               | bestSeller              |
| saldo                  | balance                | rata-rata              | average                 |
| antrean                | queue                  | sebaran                | distribution            |
| penyedia AI            | aiProvider             | saring                 | filter                  |
| pemakaian              | usage                  | rekap, ringkas         | summary / summarize     |
| jam buka               | openHours              | gabungkan              | merge                   |
| data master            | master                 | perkecil (foto)        | resize                  |
| verifikasi             | verification           | samarkan               | mask                    |
| templat                | template               | sisa (waktu)           | remaining / secondsLeft |
| transaksi              | transaction            | isian (form)           | input                   |
| tinjau                 | review                 | minta                  | request                 |
| uji                    | test                   | catat                  | record                  |
| balas                  | reply                  | tukar                  | swap                    |
| urutan                 | sortOrder              | alasan                 | reason                  |
| catatan                | note                   | kontak CS              | customerServiceContact  |
| penerima               | audience               | pesan dari meja        | tableOrder              |
| kerangka memuat        | skeleton               | grafik batang          | barChart                |
| rangka halaman         | pageFrame              | seri (grafik)          | series                  |
| sumbu                  | axis / axisTicks       | sorot                  | highlight               |
| bunyi                  | beep                   | draf                   | draft                   |
| tersimpan di server    | saved                  | selisih jam            | clockOffset             |
| jam dimuat             | loadedAt               | putus (koneksi)        | disconnected            |
| mundur (setelah galat) | backoff                | jeda kirim             | debounce                |
| langsung (live)        | live                   | ponsel                 | mobile                  |
| lipat / ciutkan        | collapsible / collapse | lebar (sidebar)        | wide                    |
| tujuan (tautan)        | target / href          | status dapur           | storeOpen               |
| pemicu                 | trigger                | wadah                  | container               |
| belum dilihat          | unseen                 | gelombang              | wave                    |
| gagal muat             | loadFailed / LoadError | muat ulang berkala     | periodicRefresh         |
| foto tambahan          | extraPhotos            | stok tidak cukup       | outOfStock              |
| aksi                   | action                 | ditunda (aksi)         | pending / deferred      |
| optimistis             | optimistic             | nonaktifkan / aktifkan | deactivate / activate   |
| geser (urutan)         | move                   | tahap, langkah         | step                    |
| pelaku                 | actor                  | lunas                  | paid                    |
| pratinjau              | preview                | disentuh (isian)       | touched                 |
| sudah dicoba kirim     | submitAttempted        | sisa waktu tahan       | holdSecondsLeft         |
| pesanan baru           | newOrder / isNew       | kembali ke             | backTo                  |
| judul / isi            | title / body           | terpakai               | used                    |
| kartu                  | card                   | jam server             | serverNow               |

Istilah yang belum ada di tabel: pilih padanan Inggris yang umum, lalu tambahkan ke tabel ini pada commit yang sama.

<!-- Bagian alur kerja, commit, dan PR ditambahkan di F28 Task 17. -->
