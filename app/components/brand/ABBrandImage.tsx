import Image from "next/image";
import { ABLogo } from "./ABLogo";

interface ABBrandImageProps {
  full?: boolean;
  eager?: boolean;
  decorative?: boolean;
  navigation?: boolean;
}

/** Optimized derivatives of the owner's supplied gold/ruby artwork. */
export function ABBrandImage({ full = false, eager = false, decorative = false, navigation = false }: ABBrandImageProps) {
  if (full) {
    return (
      <Image
        className="brand-artwork"
        src="/brand/ab-logo-luxury.webp"
        width={800}
        height={633}
        sizes="(max-width: 720px) 260px, 360px"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        quality={90}
        alt={decorative ? "" : "AB Web Studio"}
      />
    );
  }

  // Compact lockup: the authentic monogram beside a set-in-type wordmark, so
  // the name stays crisp at any size and follows the studio's mono labels.
  return (
    <span className="brand-lockup" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "AB Web Studio"} aria-hidden={decorative ? true : undefined}>
      {navigation ? (
        <span className="nav-monogram">
          <ABLogo className="brand-monogram-image" decorative />
        </span>
      ) : (
        <Image
          className="brand-monogram-image"
          src="/brand/ab-luxury-monogram.webp"
          width={48}
          height={48}
          sizes="48px"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          quality={90}
          fetchPriority={eager ? "high" : undefined}
          alt=""
        />
      )}
      <span className="brand-wordmark">AB <i>/</i> Web Studio</span>
    </span>
  );
}
