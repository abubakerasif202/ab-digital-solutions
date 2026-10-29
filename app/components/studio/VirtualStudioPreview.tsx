import { StudioArrow } from "../../studio/StudioArrow";
import Image from "next/image";
import Link from "next/link";
import styles from "../../studio/studio.module.css";

/** Static, server-rendered preview. Never imports Three.js or a studio canvas. */
export function VirtualStudioPreview() {
  return <section className={styles.preview} aria-labelledby="virtual-studio-preview">
    <div className={styles.previewInner}>
      <div className={styles.previewCopy}>
        <p className={styles.kicker}>AB WEB STUDIO — IMMERSIVE EXPERIENCE</p>
        <h2 id="virtual-studio-preview">Don&apos;t Just Visit Our Website.<br /><em>Step Inside Our Studio.</em></h2>
        <p>Experience our creative world in 3D. Explore our studio, discover our work, and see where your next big idea begins.</p>
        <Link href="/studio" prefetch={false} className={styles.primary}>Enter Our 3D Studio <StudioArrow /></Link>
        <Link href="/work" prefetch={false} className={styles.textLink}>Explore Our Work</Link>
        <p>Walk through. Look around. Discover what&apos;s possible.</p>
      </div>
      <Link href="/studio" prefetch={false} className={styles.previewArt} aria-label="Explore AB Web Studio’s virtual studio">
        <Image src="/studio/studio-poster.png" width={1440} height={900} sizes="(max-width: 600px) 100vw, 600px" priority alt="Original cutaway architecture of the AB virtual studio" />
        <span aria-hidden="true">INTERACTIVE 3D / TAP TO ENTER ↗</span>
      </Link>
    </div>
  </section>;
}
