import { ABBrandImage } from "./components/brand/ABBrandImage";
import Link from "next/link";
import { siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";
import { ArrowIcon } from "./icons";

const studioLinks = [
  ["/work", "Work"],
  ["/services", "Services"],
  ["/#process", "Process"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer studio-footer">
      <div className="studio-shell studio-footer-main">
        <div className="studio-footer-brand">
          <Link className="brand" href="/" aria-label="AB Web Studio home">
            <ABBrandImage decorative />
          </Link>
          <p>{siteConfig.description}</p>
          <Link className="footer-contact-cta button button-ghost" href="/contact">
            Discuss your idea <ArrowIcon direction="right" />
          </Link>
        </div>

        <nav className="studio-footer-col" aria-label="Footer studio navigation">
          <h2>Studio</h2>
          <ul>
            {studioLinks.map(([href, label]) => (
              <li key={href}><Link href={href}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="studio-footer-col studio-footer-col--services" aria-label="Footer services">
          <h2>Services</h2>
          <ul>
            {servicePages.map((service) => (
              <li key={service.slug}><Link href={`/services/${service.slug}`}>{service.title}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="studio-footer-col">
          <h2>Contact</h2>
          <ul>
            <li><a className="studio-footer-strong" href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a></li>
            <li><a className="studio-footer-strong studio-footer-email" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li>
            <li><span>{siteConfig.location}</span></li>
            <li><a href={siteConfig.url}>abwebstudio.com.au</a></li>
          </ul>
        </div>
      </div>

      <div className="studio-shell studio-footer-legal">
        <p>© {currentYear} AB Web Studio. All rights reserved.</p>
        <p className="studio-footer-legal-links">
          <Link href="/privacy">Privacy</Link>
          <a className="footer-top-link" href="#top">Back to top <ArrowIcon direction="up" /></a>
        </p>
      </div>
    </footer>
  );
}
