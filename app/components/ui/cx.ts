// Pembantu kelas CSS Tailwind untuk semua komponen: gabung nama kelas bersyarat dan gaya fokus keyboard bersama.
// Dipakai hampir di semua komponen di app/components dan halaman.
/**
 * Menggabungkan nama kelas CSS; nilai kosong (`false`, `null`, `undefined`, "") dibuang.
 * @param classNames daftar kelas, boleh bersyarat seperti `isActive && "font-bold"`
 * @returns kelas yang dipisah spasi
 */
export const cx = (...classNames: (string | false | null | undefined)[]) => classNames.filter(Boolean).join(" ");

/** Cincin fokus yang hanya tampil saat elemen difokus lewat keyboard (aksesibilitas). */
export const focusRing = "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";
