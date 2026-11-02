import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // D5: /riwayat dipindah ke /laporan.
  async redirects() {
    return [{ source: "/riwayat", destination: "/laporan", permanent: true }];
  },
};

export default nextConfig;
