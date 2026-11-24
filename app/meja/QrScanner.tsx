// Komponen QrScanner: tombol "Scan QR meja" yang membuka kamera HP, membaca QR meja, lalu membuka menu meja itu.
// Pemindaian memakai BarcodeDetector (pembaca kode QR bawaan peramban) pada gambar kamera dari getUserMedia
// (API peramban untuk meminta izin dan membuka kamera). Tidak ada data yang diambil dari server.
// "use client": komponen ini berjalan di peramban (client component) karena memakai kamera, state, dan efek.
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { tableTokenFromQr } from "@/lib/table-qr";

// Pemindai bawaan peramban (Chrome/Samsung Internet di Android). iPhone/Firefox belum punya:
// di sana pelanggan memakai aplikasi kamera HP, yang membuka tautan QR dengan sendirinya.
/** Bagian BarcodeDetector yang dipakai: membaca QR dari satu bingkai video. */
type QrDetector = { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
/** Konstruktor BarcodeDetector; belum ada di tipe bawaan TypeScript. */
type QrDetectorClass = new (options: { formats: string[] }) => QrDetector;
// BarcodeDetector milik peramban, atau undefined bila tidak ada.
const getDetectorClass = () => (window as unknown as { BarcodeDetector?: QrDetectorClass }).BarcodeDetector;
// Bisa memindai bila peramban punya BarcodeDetector dan akses kamera.
const canScan = () => !!getDetectorClass() && !!navigator.mediaDevices?.getUserMedia;
// Dukungan peramban tidak berubah selama halaman terbuka, jadi tidak ada yang perlu didengarkan.
const subscribeNever = () => () => {};

// Jeda antar percobaan membaca QR dari kamera.
const SCAN_INTERVAL_MS = 300;

/**
 * Mengubah galat kamera menjadi pesan untuk pembeli.
 * @param error galat dari getUserMedia; `name` menunjukkan sebabnya (izin ditolak, kamera tidak ada, dll.)
 * @returns pesan bahasa Indonesia beserta cara lain
 */
function cameraErrorMessage(error: unknown) {
  const errorName = (error as { name?: string })?.name;
  if (errorName === "NotAllowedError" || errorName === "SecurityError")
    return "Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, atau buka aplikasi kamera HP dan arahkan ke QR di meja.";
  if (errorName === "NotFoundError" || errorName === "OverconstrainedError")
    return "Kamera tidak ditemukan di perangkat ini.";
  return "Kamera tidak bisa dibuka. Coba lagi, atau pakai aplikasi kamera HP.";
}

/**
 * Pemindai QR meja. Peramban tanpa BarcodeDetector hanya menampilkan petunjuk memakai aplikasi kamera HP.
 * @returns tombol Scan QR meja, atau tampilan kamera dengan tombol Tutup kamera, beserta pesan galat bila ada
 */
export function QrScanner() {
  // 1. Router disimpan di ref: pemindaian tidak boleh diulang (dan kamera dimatikan) hanya karena identitas
  //    router berubah.
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  // 2. State: dukungan peramban, kamera menyala, pesan galat, dan petunjuk. Ref menyimpan elemen video, aliran kamera
  //    (MediaStream), dan pengatur waktu pemindaian tanpa memicu render ulang.
  const supported = useSyncExternalStore(subscribeNever, canScan, () => false);
  const [cameraOn, setCameraOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 3. Matikan kamera: hentikan pemindaian dan semua track kamera. Juga dipanggil saat komponen dilepas.
  function stopCamera() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
  useEffect(() => stopCamera, []);

  // 4. Minta izin dan buka kamera belakang; bila ditolak atau gagal, tampilkan pesan galat.
  async function startCamera() {
    // 1. Hapus pesan lama.
    setErrorMessage(null);
    setHint(null);
    // 2. Minta kamera belakang (environment); izin ditolak atau kamera tidak ada -> pesan galat.
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (error) {
      return setErrorMessage(cameraErrorMessage(error));
    }
    // 3. Kamera menyala; efek di bawah mulai memindai.
    setCameraOn(true);
  }

  // 5. Selama kamera menyala: sambungkan aliran kamera ke video, lalu coba baca QR tiap SCAN_INTERVAL_MS.
  useEffect(() => {
    // 1. Pasang aliran kamera ke elemen video dan siapkan pembaca QR.
    const videoElement = videoRef.current;
    if (!cameraOn || !videoElement || !streamRef.current) return;
    videoElement.srcObject = streamRef.current;
    void videoElement.play().catch(() => {});
    const DetectorConstructor = getDetectorClass()!;
    const detector = new DetectorConstructor({ formats: ["qr_code"] });
    // 2. Tiap putaran: lewati bila putaran sebelumnya belum selesai atau video belum siap. QR yang bukan QR meja
    //    memberi petunjuk; QR meja mematikan kamera lalu membuka menunya.
    let busy = false;
    scanTimerRef.current = setInterval(async () => {
      // 1. Jangan tumpuk pembacaan; tunggu bingkai video siap.
      if (busy || videoElement.readyState < 2) return;
      busy = true;
      // 2. Baca semua QR di bingkai ini dan ambil token meja dari isinya.
      try {
        for (const { rawValue } of await detector.detect(videoElement)) {
          const token = tableTokenFromQr(rawValue);
          if (!token) {
            setHint("QR ini bukan QR meja KateringKita.");
            continue;
          }
          stopCamera();
          routerRef.current.replace(`/meja/${token}`);
          return;
        }
      } catch {
        // bingkai belum siap; coba lagi di putaran berikutnya
      } finally {
        busy = false;
      }
    }, SCAN_INTERVAL_MS);
    // 3. Pembersihan efek hanya menghentikan pemindaian. Kamera dimatikan oleh closeCamera, hasil pindai, atau saat
    //    komponen dilepas.
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    };
  }, [cameraOn]);

  // 6. Tombol Tutup kamera.
  function closeCamera() {
    stopCamera();
    setCameraOn(false);
    setHint(null);
  }

  if (!supported) {
    return (
      <p className="text-sm text-ink-muted">
        Buka aplikasi kamera HP dan arahkan ke QR di meja; menu akan terbuka sendiri.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {cameraOn ? (
        <>
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-ink">
            <video ref={videoRef} muted playsInline aria-label="Tampilan kamera" className="size-full object-cover" />
            <span aria-hidden className="pointer-events-none absolute inset-8 rounded-xl border-4 border-surface/80" />
          </div>
          <p aria-live="polite" className="text-sm text-ink-muted">
            {hint ?? "Arahkan kamera ke QR di meja."}
          </p>
          <Button variant="secondary" onClick={closeCamera}>
            <X aria-hidden className="size-4" />
            Tutup kamera
          </Button>
        </>
      ) : (
        <Button size="lg" onClick={() => void startCamera()}>
          <Camera aria-hidden className="size-5" />
          Scan QR meja
        </Button>
      )}
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
