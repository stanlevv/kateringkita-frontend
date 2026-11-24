// Data contoh ulasan untuk test (20 ulasan dengan bintang dan komentar bervariasi).

import type { Review } from "@/types/review";
import { menus } from "./menus";
import { daysAgo } from "./time";

const CUSTOMER_NAMES = ["Rafli R.", "Salsa P.", "Dimas P.", "Nadia K.", "Bagas W.", "Intan P.", "Yoga P.", "Citra A."];
const COMMENTS: (string | null)[] = [
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

/**
 * Daftar ulasan contoh.
 * @returns daftar ulasan contoh
 */
export const reviews = (): Review[] => {
  const menuList = menus();
  return RATING.map((rating, i) => {
    const menu = menuList[(i * 5) % menuList.length];
    return {
      id: i + 1,
      menu_id: menu.id,
      menu_name: menu.name,
      customer_name: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
      rating,
      comment: COMMENTS[i % COMMENTS.length],
      created_at: daysAgo(Math.floor(i / 2)),
    };
  });
};
