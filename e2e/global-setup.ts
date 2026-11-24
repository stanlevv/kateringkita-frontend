import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { createTestAdmin, setBackendEnv, API_PORT, WEB_PORT, DB_URL } from "./helpers";

// mysql2 hanya terpasang di be/, bukan di fe/
const mysql: typeof import("../../be/node_modules/mysql2/promise") = createRequire(
  path.join(__dirname, "../../be/package.json"),
)("mysql2/promise");

const isPortInUse = (port: number, host: string) =>
  new Promise<boolean>((resolve) => {
    const socket = net.connect({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

// Skrip sebelum backend (lihat playwright.config.ts): mengosongkan DB *_e2e (nama lain ditolak), migrasi, lalu satu admin uji untuk semua spek.
export async function resetDatabase(): Promise<void> {
  const dbUrl = new URL(DB_URL);
  const name = dbUrl.pathname.slice(1);
  if (!name.endsWith("_e2e")) throw new Error(`Menolak mengosongkan DB "${name}": nama DB e2e harus berakhiran _e2e`);
  // Sebelum DROP apa pun: bila run e2e lain sedang hidup, DB-nya jangan dihapus dari bawahnya.
  for (const port of [API_PORT, WEB_PORT]) {
    for (const host of ["127.0.0.1", "::1"]) {
      if (await isPortInUse(port, host))
        throw new Error(
          `Port ${port} sedang dipakai (mungkin run e2e lain yang masih berjalan). DB e2e tidak disentuh; hentikan prosesnya lalu ulangi.`,
        );
    }
  }
  setBackendEnv();
  dbUrl.pathname = "/";
  const conn = await mysql.createConnection(dbUrl.toString()).catch((error: Error) => {
    throw new Error(`DB e2e tidak bisa dihubungi (${dbUrl.host}). Jalankan MySQL lokal. ${error.message}`);
  });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await conn.query(`CREATE DATABASE \`${name}\``);
  } finally {
    await conn.end();
  }
  const { migrate } = await import("../../be/src/scripts/migrate");
  await migrate(DB_URL);
  await createTestAdmin();
}

resetDatabase().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
