import "server-only";
import { cache } from "react";
import { hasil } from "../api";
import { geserWib } from "../format";
import { merchantFetch } from "../merchant-api";
import { getSkenario } from "../skenario";
import type { DataResult, MerchantProfile } from "../types";

// cache(): layout dan halaman berbagi satu bacaan per permintaan.
// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan agar alur SH/PG tetap bisa dipicu.
export const getProfile = cache(async (): Promise<DataResult<MerchantProfile>> => {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  const r = hasil(await merchantFetch<MerchantProfile>("/profile"));
  if ("error" in r) return r;
  const p = { ...r.data };
  if (s === "dapur-tutup") p.is_open = false;
  if (s === "penjual-baru") p.pickup_point_ids = [];
  if (s === "luar-jam") {
    // Jam sekarang di WIB; pilih rentang buka yang pasti tidak memuat sekarang.
    const jam = geserWib(Date.now()).getUTCHours();
    [p.open_time, p.close_time] = jam < 12 ? ["13:00", "16:00"] : ["06:00", "08:00"];
  }
  return { data: p };
});
