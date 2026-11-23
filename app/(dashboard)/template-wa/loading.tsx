// Kerangka memuat /template-wa. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonBox, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka TemplateEditor: kata kunci + textarea 12 baris di kiri, pratinjau chat (ChatPreview) di kanan.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Template WhatsApp"
      description="Atur isi pesan WhatsApp yang dikirim ke pembeli untuk setiap pesanan."
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
          <div>
            <SkeletonText size="lg" width="w-28" />
            <SkeletonText size="sm" width="w-4/5" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonBox key={i} className="h-12" />
              ))}
            </div>
          </div>
          <SkeletonBox className="h-76" />
          <div className="flex justify-end">
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line bg-subtle p-3">
            <span className="size-10 rounded-full bg-primary-soft" />
            <SkeletonText width="w-32" />
          </div>
          <div className="flex min-h-48 justify-end bg-subtle p-4">
            <div className="h-36 w-4/5 rounded-lg bg-surface" />
          </div>
          <div className="border-t border-line p-3">
            <SkeletonText size="sm" width="w-56" />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
