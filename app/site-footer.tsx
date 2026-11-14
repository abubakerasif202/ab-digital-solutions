import Link from "next/link";
import { ABLogo } from "./components/brand/ABLogo";
import { ArrowIcon } from "./icons";
import { servicePages } from "./services/service-data";
import { siteConfig } from "./site-config";

const studioLinks = [
  ["/work", "Work"],
  ["/services", "Services"],
  ["/about", "About"],
  ["/contact", "Start a project"],
] as const;

const whatsappHref = `https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`;
const profileLinks = [
  ["LinkedIn", siteConfig.social.linkedin],
  ["GitHub", siteConfig.social.github],
  ["Facebook", siteConfig.social.facebook],
  ["Instagram", siteConfig.social.instagram],
].filter((entry): entry is [string, string] => Boolean(entry[1]));

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="AB Web Studio home">
              <ABLogo decorative />
              <span className="brand-name">AB Web Studio</span>
            </Link>
            <p>{siteConfig.description}</p>
          </div>

          <nav className="footer-col" aria-label="Footer studio navigation">
            <h2>Studio</h2>
            <ul>
              {studioLinks.map(([href, label]) => (
                <li key={href}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Footer services">
            <h2>Services</h2>
            <ul>
              {servicePages.map((service) => (
                <li key={service.slug}><Link href={`/services/${service.slug}`}>{service.title}</Link></li>
              ))}
            </ul>
          </nav>

          <div className="footer-col">
            <h2>Contact</h2>
            <ul>
              <li><a className="footer-strong" href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a></li>
              <li><a className="footer-strong" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li>
              <li><a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Message AB Web Studio on WhatsApp (opens in a new tab)">WhatsApp</a></li>
              <li><span>{siteConfig.location}</span></li>
              <li>
                <ul className="footer-profiles" aria-label="AB Web Studio profiles">
                  {profileLinks.map(([label, href]) => (
                    <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>{label}</a></li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer-word" aria-hidden="true" data-reveal>AB Web Studio</p>

        <div className="footer-legal">
          <p>© {currentYear} AB Web Studio. All rights reserved.</p>
          <p>
            <Link href="/privacy">Privacy</Link>
            <a href="#top">Back to top <ArrowIcon direction="up" /></a>
          </p>
        </div>
      </div>
    </footer>
  );
}
