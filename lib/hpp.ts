// Kalkulator HPP (harga pokok produksi) di halaman Copilot penjual.
// Dihitung di browser agar hasil langsung berubah saat mengetik; rumusnya tidak rahasia, jadi tidak perlu ke server.

/** Satu bahan: nama, biaya beli, dan berapa porsi yang bisa dibuat dari biaya itu. */
export type Ingredient = { name: string; cost: number; portions: number };

/**
 * Memeriksa isian kalkulator HPP.
 * @param ingredients daftar bahan
 * @param margin target margin dalam persen
 * @returns pesan galat per field (kunci "0.biaya", "0.porsi", "margin", "bahan"); objek kosong bila valid
 */
export function validateHpp(ingredients: Ingredient[], margin: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (ingredients.length === 0) errors.bahan = "Tambahkan minimal satu bahan.";
  ingredients.forEach((ingredient, i) => {
    if (!Number.isInteger(ingredient.cost) || ingredient.cost <= 0)
      errors[`${i}.biaya`] = "Biaya harus bilangan bulat lebih dari 0.";
    if (!Number.isInteger(ingredient.portions) || ingredient.portions < 1)
      errors[`${i}.porsi`] = "Porsi minimal 1 dan bilangan bulat.";
  });
  if (!(margin >= 0 && margin <= 90)) errors.margin = "Target margin 0–90%.";
  return errors;
}

/**
 * Menghitung HPP per porsi dan harga jual yang disarankan (dibulatkan ke atas ke kelipatan Rp 500).
 * @param ingredients daftar bahan
 * @param targetMargin target margin dalam persen (0–90)
 * @returns `{ hpp, suggested_price }` dalam rupiah
 * @throws RangeError bila isian tidak valid (panggil `validateHpp` dulu)
 */
export function calculateHpp(
  ingredients: Ingredient[],
  targetMargin: number,
): { hpp: number; suggested_price: number } {
  if (Object.keys(validateHpp(ingredients, targetMargin)).length > 0)
    throw new RangeError("Isian kalkulator HPP tidak valid.");
  const hpp = Math.ceil(ingredients.reduce((sum, ingredient) => sum + ingredient.cost / ingredient.portions, 0) - 1e-9);
  // epsilon menahan galat floating point pada kelipatan pas
  const suggested_price = Math.ceil((hpp * 100) / ((100 - targetMargin) * 500) - 1e-9) * 500;
  return { hpp, suggested_price };
}
