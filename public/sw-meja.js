// F21 PWA pesan dari meja: membuat halaman /meja bisa dipasang ke layar utama.
// Sengaja tanpa cache: menu, stok, dan status pesanan harus selalu terbaru dari server.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
