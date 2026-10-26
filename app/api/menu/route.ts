import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { menuSchema } from "@/lib/schemas";
import { getMenuList } from "@/app/actions/menuActions";

/**
 * GET /api/menu - Mengambil daftar menu
 */
export async function GET() {
  const menus = await getMenuList();
  return NextResponse.json({ success: true, data: menus });
}

/**
 * POST /api/menu - Endpoint untuk validasi server (dapat diuji langsung via curl)
 * Menguji kriteria:
 * 1. Menolak jika tidak login (Unauthorized 401)
 * 2. Menolak data tidak valid dengan error per field (Bad Request 400)
 */
export async function POST(req: NextRequest) {
  // Cek Auth (Cookie atau Bearer Authorization Header)
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Pengguna yang belum login ditolak oleh action (401 Unauthorized).",
      },
      { status: 401 }
    );
  }

  // Parse Body
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // safeParse di server menggunakan schema Zod bersama
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validasi server gagal! Data tidak valid ditolak walau validasi klien dilewati.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Data menu valid dan berhasil disimpan di server!",
      data: parsed.data,
    },
    { status: 201 }
  );
}
