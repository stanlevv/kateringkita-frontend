import type { Review } from "@/types/review";
import { menus } from "./menus";
import { hariLalu } from "./waktu";

const NAMA = ["Rafli R.", "Salsa P.", "Dimas P.", "Nadia K.", "Bagas W.", "Intan P.", "Yoga P.", "Citra A."];
const KOMENTAR: (string | null)[] = [
  "Enak dan porsinya pas.",
  "Datang tepat waktu, masih hangat.",
  null,
  "Sambalnya mantap.",
  "Agak asin, tapi tetap enak.",
  "Pasti pesan lagi.",
  null,
  "Kemasan rapi dan bersih.",
  "Nasinya sedikit keras.",
  "Rasanya konsisten, langganan.",
];
const RATING = [5, 5, 4, 5, 3, 5, 4, 5, 2, 5, 4, 5, 5, 4, 3, 5, 4, 5, 5, 4];

export const reviews = (): Review[] => {
  const katalog = menus();
  return RATING.map((rating, i) => {
    const m = katalog[(i * 5) % katalog.length];
    return {
      id: i + 1,
      menu_id: m.id,
      menu_name: m.name,
      customer_name: NAMA[i % NAMA.length],
      rating,
      comment: KOMENTAR[i % KOMENTAR.length],
      created_at: hariLalu(Math.floor(i / 2)),
    };
  });
};
