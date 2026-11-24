// Konfigurasi Next.js untuk web penjual.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Halaman riwayat sudah digabung ke laporan; alamat lama /riwayat diarahkan permanen ke /laporan.
  async redirects() {
    return [{ source: "/riwayat", destination: "/laporan", permanent: true }];
  },
};

export default nextConfig;
