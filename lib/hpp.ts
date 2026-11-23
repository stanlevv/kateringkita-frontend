export type Ingredient = { name: string; cost: number; portions: number };

/** HP-E1: pesan per field ("0.biaya", "0.porsi", "margin", "bahan"); objek kosong bila valid. */
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

// F17: tetap dihitung di klien agar hasil tampil per ketikan tanpa round-trip; rumus tidak rahasia, jadi tanpa endpoint server
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
