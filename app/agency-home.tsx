import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
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
import { EnquirySection } from "./components/studio/EnquirySection";
import { CinematicMedia } from "./components/cinematic/CinematicMedia";
import { RubyMotion } from "./components/cinematic/RubyMotion";

const disciplines = [
  { number: "01", name: "Websites & digital experiences", description: "Distinctive design. A clear story. A considered journey from first impression to enquiry.", href: "/services/web-design-sydney", detail: "Strategy / Design / Development" },
  { number: "02", name: "Software & connected systems", description: "Practical technology shaped around the way your business works, not the other way around.", href: "/services/custom-software-business-systems", detail: "Platforms / Workflows / Integrations" },
  { number: "03", name: "Commerce & digital growth", description: "Thoughtful online stores, search-ready foundations and ongoing care for what comes next.", href: "/services/ecommerce-website-development", detail: "Commerce / Visibility / Support" },
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
            <div className="cinema-shell ruby-hero-topline">
              <p className="cinema-label"><span className="ruby-signal" />Independent digital studio</p>
              <p className="cinema-label">{siteConfig.location}</p>
            </div>
            <div className="cinema-shell ruby-hero-composition">
              <h1 id="hero-heading" className="ruby-title">
                <span className="ruby-title-row">Digital experiences.</span>{" "}
                <span className="ruby-title-row ruby-title-row--signature"><em>Beyond ordinary.</em></span>
              </h1>
              <div className="ruby-hero-actionline">
                <p>Premium websites, online stores and purpose-built business systems.</p>
                <div className="ruby-hero-actions">
                  <a className="ruby-project-cta" href="#contact"><span>Start your project</span><ArrowIcon /></a>
                  <a className="ruby-ghost-cta" href="#work"><span>See the work</span><ArrowIcon direction="right" /></a>
                </div>
              </div>
            </div>
            <div className="cinema-shell ruby-hero-bottomline">
              <ol className="ruby-scenes" aria-hidden="true">
                {scenes.map((scene, index) => <li key={scene}><span>{String(index + 1).padStart(2, "0")}</span>{scene}<i /></li>)}
              </ol>
            </div>
          </section>

          <section className="ruby-service-ticker" aria-label="Studio capabilities">
            <label className="ruby-service-ticker-control">
              <input type="checkbox" aria-controls="services-ticker-track" />
              Pause ticker
            </label>
            <div className="ruby-service-ticker-viewport">
              <div id="services-ticker-track" className="ruby-service-ticker-track">
                {[0, 1].map(copy => (
                  <ul className="ruby-service-ticker-group" role="list" key={copy} aria-hidden={copy === 1 || undefined}>
                    {bandWords.map(word => <li key={word}>{word}</li>)}
                  </ul>
                ))}
              </div>
            </div>
          </section>

          <section id="about" className="ruby-positioning" aria-labelledby="perspective-heading">
            <div className="cinema-shell ruby-positioning-grid">
              <Reveal className="ruby-plate" variant="mask">
                <div className="ruby-plate-frame">
                  <Image src="/cinematic/sydney-studio-plate.webp" alt="The AB Web Studio workspace at night: a gold AB sign on a ruby-lit wall, a laptop showing code, and Sydney Opera House and Harbour Bridge through the window" width={864} height={1080} sizes="(max-width: 720px) calc(100vw - 68px), (max-width: 960px) 30vw, (max-width: 1100px) 26vw, min(34vw, 535px)" />
                </div>
              </Reveal>
              <div className="ruby-positioning-copy">
                <Reveal as="h2" id="perspective-heading" className="ruby-statement ruby-lines">
                  <Lines lines={["Good design", "gets noticed.", { accent: "Great thinking" }, "moves you forward."]} />
                </Reveal>
                <div className="ruby-positioning-bottom">
                  <Reveal as="p">AB Web Studio brings design, development and practical technology together. To make your business easier to understand, more compelling to choose, and ready for what comes next.</Reveal>
                  <Link href="/about" className="cinema-link">The studio behind the work <ArrowIcon /></Link>
                </div>
              </div>
            </div>
          </section>

          <PortfolioSection />

          <section id="services" className="ruby-services" aria-labelledby="services-heading">
            <div className="cinema-shell">
              <header className="ruby-section-header">
                <Reveal as="h2" id="services-heading" className="ruby-lines"><Lines lines={["Design & development."]} /></Reveal>
                <p>Design that earns attention.<br />Technology that does the work.</p>
              </header>
              <ol className="ruby-disciplines">
                {disciplines.map(discipline => (
                  <li key={discipline.number}>
                    <Reveal variant="line">
                      <Link href={discipline.href} className="ruby-discipline" data-ruby-depth>
                        <span className="cinema-label ruby-discipline-number">{discipline.number}</span>
                        <h3>{discipline.name}</h3>
                        <span className="ruby-discipline-copy">{discipline.description}<span className="cinema-label">{discipline.detail}</span></span>
                        <span className="ruby-discipline-arrow"><ArrowIcon /></span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <div className="ruby-service-foot">
                <span className="cinema-label">All services</span>
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

          <div className="ruby-contact">
            <EnquirySection id="contact" showIndex={false}><ContactForm /></EnquirySection>
            <div className="cinema-shell ruby-colophon"><span>AB Web Studio / {siteConfig.location}</span><span>{projects.length} genuine project case studies</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email} <ArrowIcon /></a></div>
          </div>
        </main>
      </PageTransition>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
