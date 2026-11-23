"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// G-5. Next 16 hanya punya Link.onNavigate per tautan, jadi tautan dicegat di fase capture; tutup tab lewat beforeunload.
// Tombol kembali browser tidak dicegat.
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href");
      if (
        !anchor ||
        !href ||
        href.startsWith("#") ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [dirty]);

  return {
    open: pendingHref !== null,
    cancel: () => setPendingHref(null),
    confirm: () => {
      const target = pendingHref;
      setPendingHref(null);
      if (target) router.push(target);
    },
  };
}
