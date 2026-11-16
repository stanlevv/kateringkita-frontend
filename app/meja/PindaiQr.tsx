"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { tokenDariQr } from "@/lib/meja-qr";

// Pemindai bawaan peramban (Chrome/Samsung Internet di Android). iPhone/Firefox belum punya:
// di sana pelanggan memakai aplikasi kamera HP, yang membuka tautan QR dengan sendirinya.
type Pendeteksi = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type KelasPendeteksi = new (o: { formats: string[] }) => Pendeteksi;
const kelasPendeteksi = () => (window as unknown as { BarcodeDetector?: KelasPendeteksi }).BarcodeDetector;
const bisaPindai = () => !!kelasPendeteksi() && !!navigator.mediaDevices?.getUserMedia;
const tanpaLangganan = () => () => {};

const JEDA_MS = 300;

function pesanGalat(e: unknown) {
  const nama = (e as { name?: string })?.name;
  if (nama === "NotAllowedError" || nama === "SecurityError")
    return "Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, atau buka aplikasi kamera HP dan arahkan ke QR di meja.";
  if (nama === "NotFoundError" || nama === "OverconstrainedError") return "Kamera tidak ditemukan di perangkat ini.";
  return "Kamera tidak bisa dibuka. Coba lagi, atau pakai aplikasi kamera HP.";
}

/** F21: scan QR meja langsung dari halaman (meminta izin kamera), lalu buka menu meja itu. */
export function PindaiQr() {
  const router = useRouter();
  // pemindaian tidak boleh diulang (dan kamera dimatikan) hanya karena identitas router berubah
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const didukung = useSyncExternalStore(tanpaLangganan, bisaPindai, () => false);
  const [aktif, setAktif] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const arus = useRef<MediaStream | null>(null);
  const putaran = useRef<ReturnType<typeof setInterval> | null>(null);

  function matikan() {
    if (putaran.current) clearInterval(putaran.current);
    putaran.current = null;
    arus.current?.getTracks().forEach((t) => t.stop());
    arus.current = null;
  }
  useEffect(() => matikan, []);

  async function mulai() {
    setGalat(null);
    setInfo(null);
    try {
      arus.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      return setGalat(pesanGalat(e));
    }
    setAktif(true);
  }

  useEffect(() => {
    const v = video.current;
    if (!aktif || !v || !arus.current) return;
    v.srcObject = arus.current;
    void v.play().catch(() => {});
    const Kelas = kelasPendeteksi()!;
    const pendeteksi = new Kelas({ formats: ["qr_code"] });
    let sibuk = false;
    putaran.current = setInterval(async () => {
      if (sibuk || v.readyState < 2) return;
      sibuk = true;
      try {
        for (const { rawValue } of await pendeteksi.detect(v)) {
          const token = tokenDariQr(rawValue);
          if (!token) {
            setInfo("QR ini bukan QR meja KateringKita.");
            continue;
          }
          matikan();
          routerRef.current.replace(`/meja/${token}`);
          return;
        }
      } catch {
        // bingkai belum siap; coba lagi di putaran berikutnya
      } finally {
        sibuk = false;
      }
    }, JEDA_MS);
    // kamera dimatikan oleh tutup()/hasil pindai/lepas komponen, bukan oleh pembersihan efek ini
    return () => {
      if (putaran.current) clearInterval(putaran.current);
      putaran.current = null;
    };
  }, [aktif]);

  function tutup() {
    matikan();
    setAktif(false);
    setInfo(null);
  }

  if (!didukung) {
    return <p className="text-sm text-ink-muted">Buka aplikasi kamera HP dan arahkan ke QR di meja; menu akan terbuka sendiri.</p>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {aktif ? (
        <>
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-ink">
            <video ref={video} muted playsInline aria-label="Tampilan kamera" className="size-full object-cover" />
            <span aria-hidden className="pointer-events-none absolute inset-8 rounded-xl border-4 border-surface/80" />
          </div>
          <p aria-live="polite" className="text-sm text-ink-muted">{info ?? "Arahkan kamera ke QR di meja."}</p>
          <Button variant="secondary" onClick={tutup}><X aria-hidden className="size-4" />Tutup kamera</Button>
        </>
      ) : (
        <Button size="lg" onClick={() => void mulai()}><Camera aria-hidden className="size-5" />Scan QR meja</Button>
      )}
      {galat && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{galat}</p>}
    </div>
  );
}
