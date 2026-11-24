## Ringkasan

<!-- Apa yang berubah dan kenapa, 1-3 kalimat. -->

ID fitur / issue: <!-- mis. F28, #12 -->

## Jenis perubahan

- [ ] Fitur baru
- [ ] Perbaikan bug
- [ ] Refactor (perilaku tidak berubah)
- [ ] Dokumentasi
- [ ] Lainnya (test, konfigurasi, CI)

## Checklist

Perintah di bawah sama dan berurutan seperti CI (`.github/workflows/ci.yml`):

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run typecheck:e2e`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Tidak mengubah kontrak API (path, field JSON, kode error) atau URL halaman
- [ ] Kode baru diberi keterangan untuk pembaca baru (aturan nama dan glosarium di CONTRIBUTING.md)
- [ ] Commit `refactor`/`style` tidak mengubah perilaku, dan hash-nya ditambahkan ke `.git-blame-ignore-revs`
- [ ] Tidak ada rahasia (token, kata sandi, isi `.env`) yang ikut di-commit

## Cara menguji

<!-- Langkah untuk memeriksa perubahan ini, mis. halaman yang dibuka dan hasil yang diharapkan. -->

## Tangkapan layar

<!-- Wajib bila tampilan berubah: sebelum dan sesudah. Hapus bagian ini bila tidak ada perubahan UI. -->
