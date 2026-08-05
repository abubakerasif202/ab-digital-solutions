import Image from "next/image";
import Link from "next/link";
import { assetBase, siteConfig } from "./site-config";

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <Link className="brand" href="/" aria-label="AB Digital Solutions home">
          <Image src={`${assetBase}/ab-logo-mark.png`} alt="" width={500} height={500} />
          <span className="brand-name">AB Digital Solutions</span>
        </Link>
        <p>Premium websites, digital marketing and online growth solutions for Australian businesses.</p>
        <nav aria-label="Footer navigation">
          <Link href="/#services">Services</Link>
          <Link href="/#work">Work</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <small>© {currentYear} AB Digital Solutions. All rights reserved.</small>
        <span>{siteConfig.location} · Australia-wide</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
