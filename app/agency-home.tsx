import Link from "next/link";
import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { PageTransition } from "./components/motion/PageTransition";
import { Reveal } from "./components/motion/Reveal";
import { ContactForm } from "./components/ContactForm";
import { projects } from "./project-data";
import { serviceContactHref, servicePages } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon } from "./icons";
import { PortfolioSection } from "./components/PortfolioSection";
import { BrandFilmSection } from "./components/film/BrandFilmSection";
import { ProcessSection } from "./components/ProcessSection";
import { sectionEyebrow, sectionNumber } from "./home-sections";
import { EnquirySection } from "./components/studio/EnquirySection";
import { CinematicMedia } from "./components/cinematic/CinematicMedia";
import { RubyMotion } from "./components/cinematic/RubyMotion";

const disciplines = [
  { number: "01", title: "Presence.", name: "Websites & digital experiences", description: "Distinctive design. A clear story. A considered journey from first impression to enquiry.", href: "/services/web-design-sydney", detail: "Strategy / Design / Development" },
  { number: "02", title: "Purpose.", name: "Software & connected systems", description: "Practical technology shaped around the way your business works, not the other way around.", href: "/services/custom-software-business-systems", detail: "Platforms / Workflows / Integrations" },
  { number: "03", title: "Possibility.", name: "Commerce & digital growth", description: "Thoughtful online stores, search-ready foundations and ongoing care for what comes next.", href: "/services/ecommerce-website-development", detail: "Commerce / Visibility / Support" },
] as const;

const scenes = ["Harbour", "Arteries", "Skyline"] as const;
const bandWords = ["Websites", "Online stores", "Business systems", "Made in Sydney"] as const;

/** Per-line mask reveal: each line rises out of its own clipping row, staggered by index. */
function Lines({ lines }: { lines: readonly (string | { accent: string })[] }) {
  return (
    <>
      {lines.map((line, index) => {
        const text = typeof line === "string" ? line : line.accent;
        return (
          <span className="ruby-line" key={text} style={{ "--line": index } as CSSProperties}>
            <span>{typeof line === "string" ? text : <em>{text}</em>}</span>
          </span>
        );
      })}
    </>
  );
}

function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="ruby-word" style={{ "--word": index + offset } as CSSProperties}><span>{word}</span></span>{" "}
        </Fragment>
      ))}
    </>
  );
}

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main id="main-content" className="cinematic-home cinema-page ruby-page">
          <RubyMotion />
          <div className="ruby-scroll-progress" aria-hidden="true" />
          <section className="cinema-hero ruby-hero" aria-labelledby="hero-heading" data-ruby-depth>
            <CinematicMedia />
            <div className="ruby-hero-shade" aria-hidden="true" />
            <div className="ruby-hero-light" aria-hidden="true" />
            <div className="ruby-hero-sweep" aria-hidden="true" />
            <div className="ruby-grain" aria-hidden="true" />
            <div className="cinema-shell ruby-hero-topline">
              <p className="cinema-label"><span className="ruby-signal" />Independent digital studio</p>
              <p className="cinema-label">Sydney, Australia <i aria-hidden="true" /> Working Australia-wide</p>
            </div>
            <div className="cinema-shell ruby-hero-composition">
              <p className="cinema-label ruby-hero-overline">Thoughtful design. Exceptional presence.</p>
              <h1 id="hero-heading" className="ruby-title">
                <span className="ruby-title-row"><Words text="Digital experiences." /></span>
                <span className="ruby-title-row ruby-title-row--signature"><em><Words text="Beyond ordinary." offset={2} /></em></span>
              </h1>
              <div className="ruby-hero-actionline">
                <p>Premium websites, online stores<br />and purpose-built business systems.</p>
                <div className="ruby-hero-actions">
                  <a className="ruby-project-cta" href="#contact" data-ruby-magnet><span>Start your project</span><ArrowIcon /></a>
                  <a className="ruby-ghost-cta" href="#work"><span>See the work</span><ArrowIcon direction="right" /></a>
                </div>
              </div>
            </div>
            <div className="cinema-shell ruby-hero-bottomline">
              <a href="#work" className="ruby-discover"><span className="ruby-discover-icon" aria-hidden="true"><ArrowDown size={18} strokeWidth={1.5} /></span> Enter the exhibition</a>
              <ol className="ruby-scenes" aria-hidden="true">
                {scenes.map((scene, index) => <li key={scene}><span>{String(index + 1).padStart(2, "0")}</span>{scene}<i /></li>)}
              </ol>
              <span className="cinema-label">Sydney / In full colour</span>
            </div>
          </section>

          <div className="ruby-band" aria-hidden="true">
            <div className="ruby-band-track">
              {[0, 1].map(copy => (
                <p key={copy}>{bandWords.map(word => <span key={word}>{word}<i /></span>)}</p>
              ))}
            </div>
          </div>

          <section id="about" className="ruby-positioning" aria-labelledby="perspective-heading">
            <div className="cinema-shell ruby-positioning-grid">
              <Reveal className="ruby-plate" variant="mask">
                <div className="ruby-plate-frame">
                  <Image src="/cinematic/sydney-plate-arteries.webp" alt="Sydney at night: light trails on the freeway beneath the lit North Sydney skyline" width={864} height={1080} sizes="(max-width: 600px) 88vw, (max-width: 1100px) 36vw, 30vw" />
                </div>
                <div className="ruby-identity-mark">
                  <Image src="/brand/ab-luxury-monogram.webp" alt="AB Web Studio monogram" width={220} height={220} sizes="(max-width: 600px) 72px, 120px" />
                  <span className="cinema-label">Independent<br />by design.</span>
                </div>
              </Reveal>
              <div className="ruby-positioning-copy">
                <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("about")}</Reveal>
                <Reveal as="h2" id="perspective-heading" className="ruby-statement ruby-lines">
                  <Lines lines={["Good design", "gets noticed.", { accent: "Great thinking" }, "moves you forward."]} />
                </Reveal>
                <div className="ruby-positioning-bottom">
                  <Reveal as="p">AB Web Studio brings design, development and practical technology together. To make your business easier to understand, more compelling to choose, and ready for what comes next.</Reveal>
                  <Link href="/about" className="cinema-link">The studio behind the work <ArrowIcon /></Link>
                </div>
              </div>
              <span className="ruby-vertical-note cinema-label" aria-hidden="true">Design with intent / Develop with purpose</span>
            </div>
          </section>

          <PortfolioSection />

          <section id="services" className="ruby-services" aria-labelledby="services-heading">
            <div className="cinema-shell">
              <header className="ruby-section-header">
                <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("services")}</Reveal>
                <Reveal as="h2" id="services-heading" className="ruby-lines"><Lines lines={["Beautiful is only", { accent: "the beginning." }]} /></Reveal>
                <p>Design that earns attention.<br />Technology that does the work.</p>
              </header>
              <ol className="ruby-disciplines">
                {disciplines.map(discipline => (
                  <li key={discipline.number}>
                    <Reveal variant="line">
                      <Link href={discipline.href} className="ruby-discipline" data-ruby-depth>
                        <span className="cinema-label ruby-discipline-number">{discipline.number}</span>
                        <h3>{discipline.title}<small>{discipline.name}</small></h3>
                        <span className="ruby-discipline-copy">{discipline.description}<span className="cinema-label">{discipline.detail}</span></span>
                        <span className="ruby-discipline-arrow"><ArrowIcon /></span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <div className="ruby-service-foot">
                <span className="cinema-label">A considered digital practice</span>
                <ul aria-label="All digital services">
                  {servicePages.map(service => (
                    <li key={service.slug}>
                      <Link href={`/services/${service.slug}`}>{service.title}</Link>
                      <Link className="ruby-service-enquire" href={serviceContactHref(service)} aria-label={`Enquire about ${service.title}`}>Enquire <ArrowIcon direction="right" /></Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <BrandFilmSection />
          <ProcessSection />

          <section className="ruby-contact" aria-labelledby="ruby-contact-heading">
            <div className="ruby-contact-scene" data-ruby-depth>
              <div className="ruby-contact-plate" aria-hidden="true">
                <Image src="/cinematic/sydney-plate-harbour.webp" alt="" width={1920} height={868} sizes="100vw" />
              </div>
              <div className="cinema-shell ruby-contact-intro">
                <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("contact")}</Reveal>
                <Reveal as="h2" id="ruby-contact-heading" className="ruby-lines"><Lines lines={["Your next chapter.", { accent: "Let’s make it matter." }]} /></Reveal>
                <div className="ruby-contact-intro-bottom">
                  <p>Tell us where you want to go.<br />We’ll help you find the way.</p>
                  <a href={`tel:${siteConfig.phoneInternational}`} className="cinema-link">{siteConfig.phoneDisplay} <ArrowIcon /></a>
                </div>
              </div>
            </div>
            <EnquirySection id="contact" index={sectionNumber("enquiry")}><ContactForm /></EnquirySection>
            <div className="cinema-shell ruby-colophon"><span>AB Web Studio / Sydney, Australia</span><span>{projects.length} genuine project case studies</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email} <ArrowIcon /></a></div>
          </section>
        </main>
      </PageTransition>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
