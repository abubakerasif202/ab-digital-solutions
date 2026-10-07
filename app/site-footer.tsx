import "./studio-pages.css";
import { ABBrandImage } from "./components/brand/ABBrandImage";
import Link from "next/link";
import { siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";
import { Mail, MapPin, Phone } from "lucide-react";
import { ArrowIcon, Glyph, StudioSignature } from "./icons";

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer">
      <div className="container footer-statement">
        <p className="eyebrow section-index"><span className="eyebrow-mark" />Have a project in mind?</p>
        <Link className="footer-statement-link" href="/contact" data-magnetic>
          <span className="footer-statement-line">Let’s make</span>
          <span className="footer-statement-line footer-statement-accent">something</span>
          <span className="footer-statement-line">worth using.</span>
          <span className="footer-statement-arrow"><ArrowIcon /></span>
        </Link>
      </div>
      <div className="container footer-main">
        <div className="footer-intro">
          <Link className="brand" href="/" aria-label="AB Web Studio home">
            <ABBrandImage decorative />
          </Link>
          <p>Websites · Systems · Digital products.</p>
          <a href={siteConfig.url}>abwebstudio.com.au</a>
          <span className="footer-location"><Glyph icon={MapPin} size={14} />{siteConfig.location} · Australia-wide</span>
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
            <Link href="/services">Services</Link>
            <Link href="/#process">Process</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </nav>

        <div className="footer-contact">
          <span>Start a project</span>
          <p>Tell us what you are building and we will come back with a practical next step.</p>
          <Link className="footer-contact-cta" href="/contact">Start a Project <ArrowIcon /></Link>
          <a className="footer-contact-line" href={`mailto:${siteConfig.email}`}><Glyph icon={Mail} size={14} />{siteConfig.email}</a>
          <a className="footer-contact-line" href={`tel:${siteConfig.phoneInternational}`}><Glyph icon={Phone} size={14} />{siteConfig.phoneDisplay}</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <StudioSignature />
        <small>© {currentYear} AB Web Studio. All rights reserved.</small>
        <span>{siteConfig.location} · Australia-wide</span>
        <a className="footer-top-link" href="#top">Back to top <ArrowIcon direction="up" /></a>
      </div>
    </footer>
  );
}
