import { useId } from "react";
import { LOGO_PATHS } from "../logo-mark";

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
      <path d={LOGO_PATHS.letterA} fill="currentColor" />
      <path d={LOGO_PATHS.letterB} fill="currentColor" />
      <path d={LOGO_PATHS.slash} fill={monochrome ? "currentColor" : "#D21736"} />
    </svg>
  );
}
