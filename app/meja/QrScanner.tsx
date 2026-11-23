"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { tableTokenFromQr } from "@/lib/table-qr";

// Pemindai bawaan peramban (Chrome/Samsung Internet di Android). iPhone/Firefox belum punya:
// di sana pelanggan memakai aplikasi kamera HP, yang membuka tautan QR dengan sendirinya.
type QrDetector = { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type QrDetectorClass = new (options: { formats: string[] }) => QrDetector;
const getDetectorClass = () => (window as unknown as { BarcodeDetector?: QrDetectorClass }).BarcodeDetector;
const canScan = () => !!getDetectorClass() && !!navigator.mediaDevices?.getUserMedia;
const subscribeNever = () => () => {};

const SCAN_INTERVAL_MS = 300;

function cameraErrorMessage(error: unknown) {
  const errorName = (error as { name?: string })?.name;
  if (errorName === "NotAllowedError" || errorName === "SecurityError")
    return "Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, atau buka aplikasi kamera HP dan arahkan ke QR di meja.";
  if (errorName === "NotFoundError" || errorName === "OverconstrainedError")
    return "Kamera tidak ditemukan di perangkat ini.";
  return "Kamera tidak bisa dibuka. Coba lagi, atau pakai aplikasi kamera HP.";
}

/** F21: scan QR meja langsung dari halaman (meminta izin kamera), lalu buka menu meja itu. */
export function QrScanner() {
  const router = useRouter();
  // pemindaian tidak boleh diulang (dan kamera dimatikan) hanya karena identitas router berubah
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const supported = useSyncExternalStore(subscribeNever, canScan, () => false);
  const [cameraOn, setCameraOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopCamera() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
  useEffect(() => stopCamera, []);

  async function startCamera() {
    setErrorMessage(null);
    setHint(null);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (error) {
      return setErrorMessage(cameraErrorMessage(error));
    }
    setCameraOn(true);
  }

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!cameraOn || !videoElement || !streamRef.current) return;
    videoElement.srcObject = streamRef.current;
    void videoElement.play().catch(() => {});
    const DetectorConstructor = getDetectorClass()!;
    const detector = new DetectorConstructor({ formats: ["qr_code"] });
    let busy = false;
    scanTimerRef.current = setInterval(async () => {
      if (busy || videoElement.readyState < 2) return;
      busy = true;
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
    // kamera dimatikan oleh tutup()/hasil pindai/lepas komponen, bukan oleh pembersihan efek ini
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    };
  }, [cameraOn]);

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
