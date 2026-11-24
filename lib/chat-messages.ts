// Logika murni (tanpa React) untuk chat pesanan: menggabungkan pesan yang sudah tampil dengan pesan dari cek berkala.
// Dipakai OrderChatPanel (app/components/orders).

import type { ChatMessage } from "@/types/order-chat";

/**
 * Menggabungkan dua daftar pesan tanpa duplikat. Pesan dengan id yang sama dari `incoming` menggantikan yang lama,
 * lalu hasilnya diurutkan menurut id (id dari server selalu naik sesuai urutan kirim). Masukan tidak diubah.
 * @param current pesan yang sedang tampil
 * @param incoming pesan baru dari cek berkala atau hasil kirim
 * @returns daftar pesan baru, urut id naik
 */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((first, second) => first.id - second.id);
}
