import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../../icons";
import { projects } from "../../project-data";
import { siteConfig } from "../../site-config";
import { Reveal } from "../motion/Reveal";

const values = [
  ["Clear communication", "Simple advice and transparent decisions."],
  ["Reliable delivery", "A professional process from brief to launch."],
  ["Results-focused work", "Design choices connected to business goals."],
] as const;

interface StudioAboutProps {
  /** Section anchor, e.g. "about" on the homepage. */
  id?: string;
  /** Editorial section number shown in the eyebrow. */
  index?: string;
  headingAs?: "h1" | "h2";
  headingId?: string;
  /** Adds a route link to the full About page (used on the homepage). */
  showStudioLink?: boolean;
}

/**
 * The studio introduction from the approved "about & enquiry" design: the
 * monogram plate on the left, editorial copy and verifiable studio facts on
 * the right. Shared by the homepage and /about so the two never drift.
 */
export function StudioAbout({
  id,
  index = "06",
  headingAs: Heading = "h2",
  headingId = "about-heading",
  showStudioLink = false,
}: StudioAboutProps) {
  return (
    <section className="studio-about" id={id} aria-labelledby={headingId}>
      <div className="studio-shell studio-split">
        <Reveal as="div" className="studio-about-plate-wrap" variant="mask">
          <figure className="studio-about-plate">
            <div className="studio-plate studio-plate--mark" data-tilt>
              <span className="studio-plate-ring studio-plate-ring--outer" aria-hidden="true" />
              <span className="studio-plate-ring studio-plate-ring--inner" aria-hidden="true" />
              <span className="studio-plate-glint" aria-hidden="true" />
              <Image
                className="studio-plate-monogram"
                src="/brand/ab-hero-monogram.webp"
                width={960}
                height={800}
                sizes="(max-width: 720px) 48vw, 280px"
                alt="AB Web Studio monogram"
              />
            </div>
            <figcaption className="studio-plate-caption">
              <span>AB <i aria-hidden="true">/</i> Web Studio</span>
              <span>Sydney <i aria-hidden="true">/</i> Australia</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="studio-about-copy">
          <Reveal as="p" className="eyebrow section-index" variant="fade-up">
            <span className="section-index-num">{index}</span><span className="micro-rule" aria-hidden="true" />About AB
          </Reveal>
          <Heading id={headingId} className="studio-display">
            Your digital presence should <em>work as hard</em> as you do.
          </Heading>
          <Reveal as="p" className="studio-lead" variant="blur" delay={80}>
            AB Web Studio is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.
          </Reveal>
          <Reveal as="p" className="studio-body" variant="blur" delay={140}>
            Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking. The result is a distinctive website with a clear commercial purpose, not a generic template dressed in your colours.
          </Reveal>

          <Reveal as="dl" className="studio-facts studio-plate" variant="fade-up" delay={120}>
            <div>
              <dt>Founder &amp; Lead Developer</dt>
              <dd>Abubakar Asif</dd>
            </div>
            <div>
              <dt>Working Australia-wide</dt>
              <dd>{siteConfig.location}</dd>
            </div>
            <div>
              <dt>Project case studies</dt>
              <dd className="studio-facts-count">{projects.length}</dd>
            </div>
          </Reveal>

          <Reveal as="dl" className="studio-values" variant="fade-up" delay={180}>
            {values.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </Reveal>

          {showStudioLink && (
            <Link className="studio-text-link" href="/about">
              Inside the studio <ArrowIcon />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
