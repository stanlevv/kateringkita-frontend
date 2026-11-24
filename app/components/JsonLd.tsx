// Menyisipkan JSON-LD; "<" di-escape agar data tidak bisa menutup tag script (sama seperti app/page.tsx).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
