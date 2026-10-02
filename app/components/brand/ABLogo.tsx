import { useId } from "react";

interface ABLogoProps {
  className?: string;
  title?: string;
  decorative?: boolean;
  monochrome?: boolean;
}

/** Flat vector mark: the interface never depends on WebGL or raster imagery. */
export function ABLogo({ className, title = "AB Web Studio", decorative = false, monochrome = false }: ABLogoProps) {
  const titleId = useId();
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 80 64"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <path d="M4 52 19 12h8l15 40h-9l-3-9H15l-3 9H4Zm14-17h9l-4.5-13L18 35Z" fill="currentColor" />
      <path d="M44 12h14c9 0 14 4 14 11 0 4-2 7-5 9 4 2 6 5 6 9 0 7-5 11-15 11H44V12Zm8 8v9h6c4 0 6-2 6-5s-2-4-6-4h-6Zm0 17v7h6c5 0 7-1 7-4s-2-3-7-3h-6Z" fill="currentColor" />
      <path d="M34 54 47 10h4L38 54Z" fill={monochrome ? "currentColor" : "#D21736"} />
    </svg>
  );
}
