export const cx = (...classNames: (string | false | null | undefined)[]) => classNames.filter(Boolean).join(" ");

export const focusRing = "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";
