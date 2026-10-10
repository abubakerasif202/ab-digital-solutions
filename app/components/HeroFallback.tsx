import Image from "next/image";

/** The approved artwork remains visible before WebGL and on constrained devices. */
export function HeroFallback() {
  return (
    <div className="hero-3d-fallback" aria-hidden="true">
      <Image className="hero-sculpture hero-monogram" src="/brand/ab-hero-monogram.webp" width={960} height={800} sizes="(max-width: 720px) 220px, (max-width: 1024px) 360px, 540px" preload alt="" />
    </div>
  );
}
