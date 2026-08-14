import Image from "next/image";
import Link from "next/link";
import { assetBase, siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";
import { ArrowIcon } from "./icons";

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-intro">
          <Link className="brand" href="/" aria-label="AB Digital Solutions home">
            <Image
              src={`${assetBase}/ab-logo-mark.png`}
              alt=""
              width={400}
              height={340}
              sizes="48px"
            />
            <span className="brand-name">AB Digital Solutions</span>
          </Link>
          <p>Premium websites, digital marketing and online growth solutions for Australian businesses.</p>
          <span>{siteConfig.location} · Australia-wide</span>
        </div>

        <nav className="footer-link-group footer-services" aria-label="Footer services">
          <span>Services</span>
          <div>
            {servicePages.map((service) => (
              <Link href={`/services/${service.slug}`} key={service.slug}>{service.title}</Link>
            ))}
          </div>
        </nav>

        <nav className="footer-link-group" aria-label="Footer studio navigation">
          <span>Studio</span>
          <div>
            <Link href="/work">Case studies &amp; work</Link>
            <Link href="/#work">Featured work</Link>
            <Link href="/#process">Process</Link>
            <Link href="/#about">About</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </nav>

        <div className="footer-contact">
          <span>Start a project</span>
          <p>Tell us what you are building and we will come back with a practical next step.</p>
          <Link className="footer-contact-cta" href="/#contact">Start a Project <ArrowIcon /></Link>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <small>© {currentYear} AB Digital Solutions. All rights reserved.</small>
        <span>{siteConfig.location} · Australia-wide</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
