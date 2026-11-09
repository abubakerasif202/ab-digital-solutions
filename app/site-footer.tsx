import Link from "next/link";
import { siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";
import { MessageCircle } from "lucide-react";
import { ArrowIcon, Glyph } from "./icons";

const studioLinks = [
  ["/work", "Work"],
  ["/services", "Services"],
  ["/studio", "Virtual Studio"],
  ["/#process", "Process"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

// Lucide 1.x ships no brand glyphs, so profiles are plain text links; WhatsApp uses a generic chat icon.
const whatsappHref = `https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`;
const profileLinks = [
  ["LinkedIn", siteConfig.social.linkedin],
  ["GitHub", siteConfig.social.github],
  ["Facebook", siteConfig.social.facebook],
  ["Instagram", siteConfig.social.instagram],
].filter((entry): entry is [string, string] => Boolean(entry[1]));

export function SiteFooter({ currentYear }: { currentYear: number }) {
  return (
    <footer className="site-footer studio-footer">
      <div className="studio-shell footer-opening">
        <h2>Good things start<br />with a conversation.</h2>
        <Link className="footer-opening-link" href="/contact">Let’s talk <ArrowIcon /></Link>
      </div>
      <div className="studio-shell studio-footer-main">
        <div className="studio-footer-brand">
          <Link className="brand" href="/" aria-label="AB Web Studio home">
            <span className="identity-mark" aria-hidden="true">ab<span>.</span></span>
            <span className="identity-name" aria-hidden="true">Web<br />Studio</span>
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
            <li><a className="studio-footer-social" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Message AB Web Studio on WhatsApp (opens in a new tab)"><Glyph icon={MessageCircle} size={16} /> WhatsApp</a></li>
            <li><span>{siteConfig.location}</span></li>
            <li>
              <ul className="studio-footer-profiles" aria-label="AB Web Studio profiles">
                {profileLinks.map(([label, href]) => (
                  <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>{label}</a></li>
                ))}
              </ul>
            </li>
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
