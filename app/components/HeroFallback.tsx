import Image from "next/image";

/** Supplied gilt and ruby artwork, shared with the optional WebGL image plane. */
export function HeroFallback() {
  return (
    <div className="hero-3d-fallback" aria-hidden="true">
      <Image
        src="/brand/ab-hero-monogram.webp"
        width={936}
        height={792}
        sizes="(max-width: 720px) 200px, (max-width: 1024px) 360px, 640px"
        loading="eager"
        className="hero-sculpture"
        alt=""
      />
    </div>
  );
}
