import Image from "next/image";

interface ABBrandImageProps {
  full?: boolean;
  eager?: boolean;
  decorative?: boolean;
}

/** Optimized derivatives of the owner's supplied gold/ruby artwork. */
export function ABBrandImage({ full = false, eager = false, decorative = false }: ABBrandImageProps) {
  if (full) {
    return <Image className="brand-artwork" src="/brand/ab-logo-luxury.webp" width={800} height={633} sizes="(max-width: 720px) 260px, 360px" alt={decorative ? "" : "AB Web Studio"} />;
  }

  // Compact lockup: the authentic monogram beside a set-in-type wordmark, so
  // the name stays crisp at any size and follows the studio's mono labels.
  return (
    <span className="brand-lockup" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "AB Web Studio"} aria-hidden={decorative ? true : undefined}>
      <Image className="brand-monogram-image" src="/brand/ab-luxury-monogram.webp" width={48} height={48} sizes="48px" alt="" loading={eager ? "eager" : "lazy"} />
      <span className="brand-wordmark">AB <i>/</i> Web Studio</span>
    </span>
  );
}
