import { StudioArrow } from "../../studio/StudioArrow";
import Image from "next/image";
import Link from "next/link";
import styles from "../../studio/studio.module.css";

/** Static, server-rendered preview. Never imports Three.js or a studio canvas. */
export function VirtualStudioPreview() {
  return <section className={styles.preview} aria-labelledby="virtual-studio-preview">
    <div className={styles.previewInner}>
      <div className={styles.previewCopy}>
        <p className={styles.kicker}>AB / A space to explore</p>
        <h2 id="virtual-studio-preview">Come on in.<br /><em>Look around.</em></h2>
        <p>Step inside our virtual studio. Discover the work, explore our capabilities and find a place for your next idea.</p>
        <Link href="/studio" prefetch={false} className={styles.primary}>Explore the Studio <StudioArrow /></Link>
      </div>
      <Link href="/studio" prefetch={false} className={styles.previewArt} aria-label="Explore AB Web Studio’s virtual studio">
        <Image src="/studio/studio-poster.png" width={1440} height={900} sizes="(max-width: 600px) 100vw, 600px" alt="Original cutaway architecture of the AB virtual studio" />
        <span aria-hidden="true">FOUR SPACES / ONE STUDIO ↗</span>
      </Link>
    </div>
  </section>;
}
