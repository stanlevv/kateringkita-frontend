export type Bahan = { nama: string; biaya: number; porsi: number };

/** HP-E1: pesan per field ("0.biaya", "0.porsi", "margin", "bahan"); objek kosong bila valid. */
export function cekHpp(bahan: Bahan[], margin: number): Record<string, string> {
  const g: Record<string, string> = {};
  if (bahan.length === 0) g.bahan = "Tambahkan minimal satu bahan.";
  bahan.forEach((b, i) => {
    if (!Number.isInteger(b.biaya) || b.biaya <= 0) g[`${i}.biaya`] = "Biaya harus bilangan bulat lebih dari 0.";
    if (!Number.isInteger(b.porsi) || b.porsi < 1) g[`${i}.porsi`] = "Porsi minimal 1 dan bilangan bulat.";
  });
  if (!(margin >= 0 && margin <= 90)) g.margin = "Target margin 0–90%.";
  return g;
}

// F17: tetap dihitung di klien agar hasil tampil per ketikan tanpa round-trip; rumus tidak rahasia, jadi tanpa endpoint server
export function hitungHpp(bahan: Bahan[], targetMargin: number): { hpp: number; suggested_price: number } {
  if (Object.keys(cekHpp(bahan, targetMargin)).length > 0) throw new RangeError("Isian kalkulator HPP tidak valid.");
  const hpp = Math.ceil(bahan.reduce((a, b) => a + b.biaya / b.porsi, 0) - 1e-9);
  // epsilon menahan galat floating point pada kelipatan pas
  const suggested_price = Math.ceil((hpp * 100) / ((100 - targetMargin) * 500) - 1e-9) * 500;
  return { hpp, suggested_price };
}
