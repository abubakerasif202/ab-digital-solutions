import type { ReactNode } from "react";
import { ArrowIcon } from "../../icons";
import { siteConfig } from "../../site-config";
import { Reveal } from "../motion/Reveal";

interface EnquirySectionProps {
  /** Anchor used by the header CTA and the mobile conversion bar. */
  id?: string;
  index?: string;
  headingAs?: "h1" | "h2";
  headingId?: string;
  /** Optional breadcrumb or context line rendered above the eyebrow. */
  before?: ReactNode;
  /** The enquiry form. */
  children: ReactNode;
}

const whatsappHref = `https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`;

/**
 * The enquiry composition from the approved design: an editorial invitation
 * and direct contact rows beside the project enquiry form, under a single
 * controlled ruby light. Shared by the homepage and /contact.
 */
export function EnquirySection({
  id,
  index = "07",
  headingAs: Heading = "h2",
  headingId = "contact-heading",
  before,
  children,
}: EnquirySectionProps) {
  return (
    <section className="studio-enquiry" id={id} aria-labelledby={headingId}>
      <div className="studio-shell studio-split studio-split--enquiry">
        <div className="studio-enquiry-copy">
          {before}
          <Reveal as="p" className="eyebrow section-index" variant="fade-up">
            <span className="section-index-num">{index}</span><span className="micro-rule" aria-hidden="true" />Start a conversation
          </Reveal>
          <Heading id={headingId} className="studio-display">
            Let’s build your next <em>digital advantage.</em>
          </Heading>
          <Reveal as="p" className="studio-body studio-body--lead" variant="blur" delay={80}>
            Tell us what you are building and where you want the business to go. We will come back with a practical next step.
          </Reveal>
          <Reveal as="ul" className="studio-contact-rows" variant="fade-up" delay={140} aria-label="Contact directly">
            <li>
              <a href={`tel:${siteConfig.phoneInternational}`}>
                <span className="studio-contact-label">Call</span>
                <strong>{siteConfig.phoneDisplay}</strong>
                <ArrowIcon direction="right" />
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`}>
                <span className="studio-contact-label">Email</span>
                <strong className="studio-contact-email">{siteConfig.email}</strong>
                <ArrowIcon direction="right" />
              </a>
            </li>
            <li>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <span className="studio-contact-label">WhatsApp</span>
                <strong>Message directly</strong>
                <ArrowIcon />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </Reveal>
          <p className="studio-enquiry-location">{siteConfig.location} <i aria-hidden="true">/</i> Working Australia-wide</p>
        </div>

        <Reveal as="div" className="studio-enquiry-form" variant="fade-up" delay={120}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
