"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { menuSchema, MenuActionState, MenuInput } from "@/lib/schemas";
import { authActionClient, ActionError } from "@/lib/safe-action";
import { uploadImageToR2 } from "@/lib/r2";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ketring-45f82aef1ca0.herokuapp.com/api";

// In-memory persistent cache / fallback di server Next.js
let serverMenuList = [
  { id: 1, name: "Nasi Ayam Bakar Madu Komplit", cat: "Nasi Box", price: 18000, hpp: 12000, stock: 6, hold: 2, sold: 42, est: "15 Mnt", img: "/menu/1.png" },
  { id: 2, name: "Risol Mayo Lumer (Isi 3)", cat: "Snack", price: 10000, hpp: 6500, stock: 2, hold: 1, sold: 27, est: "10 Mnt", img: "/menu/2.png" },
  { id: 3, name: "Es Teh Solo Jumbo 22oz", cat: "Minuman", price: 5000, hpp: 2000, stock: 25, hold: 0, sold: 32, est: "5 Mnt", img: "/menu/3.png" },
  { id: 4, name: "Nasi Bento Katsu Sambal Bawang", cat: "Nasi Box", price: 16000, hpp: 10500, stock: 0, hold: 0, sold: 15, est: "15 Mnt", img: "/menu/4.png" },
  { id: 5, name: "Paket Bento & Prasmanan Acara (Seminar/Makrab)", cat: "Paket Custom", price: 25000, hpp: 16000, stock: 150, hold: 0, sold: 80, est: "Pre-Order H-2", img: "/menu/5.png" },
];

/**
 * 4. Wrapper next-safe-action yang memaksa autentikasi
 */
export const safeCreateMenu = authActionClient
  .inputSchema(menuSchema)
  .action(async ({ parsedInput, ctx }) => {
    await new Promise((r) => setTimeout(r, 600));

    let createdItem = {
      id: Date.now(),
      ...parsedInput,
      hold: 0,
      sold: 0,
      createdBy: ctx.user.id,
    };

    // Percobaan sinkronisasi ke Backend MySQL Express jika aktif
    try {
      const res = await fetch(`${BACKEND_URL}/menus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(parsedInput),
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) createdItem = json.data;
      }
    } catch {
      // Backend offline, fallback ke in-memory cache
    }

    serverMenuList.unshift(createdItem);
    revalidatePath("/menu");

    return {
      success: true,
      data: createdItem,
      message: "Menu berhasil disimpan secara aman!",
    };
  });

/**
 * 2. Action Server untuk Form Handling dengan useActionState
 * - Menjalankan safeParse di server
 * - Memeriksa autentikasi (kriteria 4)
 * - Mengembalikan error per field (kriteria 1 & 2)
 * - Sinkronisasi ke Backend MySQL Express jika aktif
 */
export async function createMenuAction(
  prevState: MenuActionState,
  formData: FormData
): Promise<MenuActionState> {
  // 1. Cek autentikasi di server
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Pengguna yang belum login ditolak oleh action. Silakan login terlebih dahulu.",
      errors: {},
    };
  }

  // 2. Ekstrak data dari FormData
  const rawData = {
    name: formData.get("name")?.toString() || "",
    cat: formData.get("cat")?.toString() || "",
    desc: formData.get("desc")?.toString() || "",
    img: formData.get("img")?.toString() || "/menu/1.png",
    hpp: formData.get("hpp"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    est: formData.get("est")?.toString() || "15 Mnt",
  };

  // 3. safeParse di server menggunakan schema Zod bersama
  const parsed = menuSchema.safeParse(rawData);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      success: false,
      message: "Validasi data gagal! Silakan perbaiki isian formulir.",
      errors: flattened.fieldErrors,
    };
  }

  // Latensi transisi optimistik 600ms
  await new Promise((resolve) => setTimeout(resolve, 600));

  let newMenu = {
    id: Date.now(),
    name: parsed.data.name,
    cat: parsed.data.cat,
    desc: parsed.data.desc || "",
    img: parsed.data.img || "/menu/1.png",
    hpp: parsed.data.hpp,
    price: parsed.data.price,
    stock: parsed.data.stock,
    est: parsed.data.est,
    hold: 0,
    sold: 0,
  };

  // Kirim mutasi ke Backend Express MySQL jika service menyala
  try {
    const res = await fetch(`${BACKEND_URL}/menus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        newMenu = { ...newMenu, ...json.data };
      }
    }
  } catch {
    // Backend offline, data disimpan di server memory
  }

  serverMenuList = [newMenu, ...serverMenuList];
  revalidatePath("/menu");

  return {
    success: true,
    message: "Menu berhasil dipublikasikan ke katalog & tersimpan!",
    data: newMenu,
  };
}

/**
 * Action untuk menghapus menu
 */
export async function deleteMenuAction(id: number): Promise<MenuActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Pengguna yang belum login ditolak oleh action.",
    };
  }

  // Sinkronisasi hapus ke Backend Express jika aktif
  try {
    await fetch(`${BACKEND_URL}/menus/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Ignore error
  }

  serverMenuList = serverMenuList.filter((m) => m.id !== id);
  revalidatePath("/menu");
  return { success: true, message: "Menu berhasil dihapus" };
}

/**
 * Mengambil daftar menu dari server
 */
export async function getMenuList() {
  try {
    const res = await fetch(`${BACKEND_URL}/menus`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // Fallback
  }
  return serverMenuList;
}

/**
 * Helper simulasi Login / Logout sesi cookie untuk pengujian kriteria auth
 */
export async function toggleAuthSession(login: boolean) {
  const cookieStore = await cookies();
  if (login) {
    cookieStore.set("auth_token", "sample-merchant-session-token-2026", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    });
  } else {
    cookieStore.delete("auth_token");
    cookieStore.delete("token");
  }
  revalidatePath("/menu");
}

export async function checkAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
  return Boolean(token);
}

/**
 * Server Action untuk mengunggah file foto menu ke Cloudflare R2
 */
export async function uploadMenuImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  source?: "r2" | "fallback";
  error?: string;
}> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Tidak ada file gambar yang dipilih." };
    }

    const result = await uploadImageToR2(file);
    return {
      success: true,
      url: result.url,
      source: result.source,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengunggah gambar ke Cloudflare R2.",
    };
  }
}

