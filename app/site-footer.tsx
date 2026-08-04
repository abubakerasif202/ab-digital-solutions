import Image from "next/image";
import { assetBase, siteConfig } from "./site-config";

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <a className="brand footer-brand" href="/" aria-label="AB Digital Solutions home">
          <Image src={`${assetBase}/ab-logo-mark.png`} alt="" width={500} height={500} />
          <span className="brand-name">AB Digital Solutions</span>
        </a>
        <p>Premium websites, digital marketing and online growth solutions for Australian businesses.</p>
        <nav aria-label="Footer navigation">
          <a href="/#services">Services</a>
          <a href="/#work">Work</a>
          <a href="/#about">About</a>
          <a href="/#contact">Contact</a>
          <a href="/privacy">Privacy</a>
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
