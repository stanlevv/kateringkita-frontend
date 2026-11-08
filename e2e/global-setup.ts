import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { buatAdmin, isiEnvBackend, PORT_API, PORT_WEB, URL_DB } from "./bantu";

// mysql2 hanya terpasang di be/, bukan di fe/
const mysql: typeof import("../../be/node_modules/mysql2/promise") =
  createRequire(path.join(__dirname, "../../be/package.json"))("mysql2/promise");

const adaPendengar = (port: number, host: string) =>
  new Promise<boolean>((selesai) => {
    const s = net.connect({ port, host });
    s.once("connect", () => { s.destroy(); selesai(true); });
    s.once("error", () => selesai(false));
  });

// Skrip sebelum backend (lihat playwright.config.ts): mengosongkan DB *_e2e (nama lain ditolak), migrasi, lalu satu admin uji untuk semua spek.
export async function siapkanDb(): Promise<void> {
  const u = new URL(URL_DB);
  const name = u.pathname.slice(1);
  if (!name.endsWith("_e2e")) throw new Error(`Menolak mengosongkan DB "${name}": nama DB e2e harus berakhiran _e2e`);
  // Sebelum DROP apa pun: bila run e2e lain sedang hidup, DB-nya jangan dihapus dari bawahnya.
  for (const port of [PORT_API, PORT_WEB]) {
    for (const host of ["127.0.0.1", "::1"]) {
      if (await adaPendengar(port, host)) throw new Error(`Port ${port} sedang dipakai (mungkin run e2e lain yang masih berjalan). DB e2e tidak disentuh; hentikan prosesnya lalu ulangi.`);
    }
  }
  isiEnvBackend();
  u.pathname = "/";
  const conn = await mysql.createConnection(u.toString()).catch((e: Error) => {
    throw new Error(`DB e2e tidak bisa dihubungi (${u.host}). Jalankan MySQL lokal. ${e.message}`);
  });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await conn.query(`CREATE DATABASE \`${name}\``);
  } finally {
    await conn.end();
  }
  const { migrate } = await import("../../be/src/scripts/migrate");
  await migrate(URL_DB);
  await buatAdmin();
}

siapkanDb().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
