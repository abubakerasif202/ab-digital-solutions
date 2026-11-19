import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { PageTransition } from "./components/motion/PageTransition";
import { Reveal } from "./components/motion/Reveal";
import { ContactForm } from "./components/ContactForm";
import { projects, type Project } from "./project-data";
import { findService, serviceContactHref, serviceDisciplines } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon } from "./icons";
import { PortfolioSection } from "./components/PortfolioSection";
import { ProcessSection } from "./components/ProcessSection";
import { EnquirySection } from "./components/studio/EnquirySection";
import { HeroWorkWall } from "./components/cinematic/HeroWorkWall";
import { RubyMotion } from "./components/cinematic/RubyMotion";
import "./components/cinematic/work-wall.css";
import { TickerToggle } from "./components/cinematic/TickerToggle";
import { CapabilityCount } from "./components/cinematic/CapabilityCount";
import { ProjectArtwork } from "./project-artwork";

const featuredSlugs = ["jufaja-homes", "aftab-sons-transport", "247-inventory-system"];
const proofProjects: readonly Project[] = featuredSlugs.flatMap(slug => projects.filter(project => project.slug === slug));
const deviceProject = projects.find(project => project.slug === "wild-pest-solutions");
const phoneCapture = deviceProject?.gallery?.find(shot => shot.aspectRatio === "390 / 844");
const preferredStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Prisma", "Vercel"];
const documentedStack = preferredStack.filter(tool => projects.some(project => project.techStack.some(used => used === tool)));
const bandWords = ["Websites", "Online stores", "Business systems", "Made in Sydney"] as const;
const heroSummary = `${projects.length} websites, online stores and business systems shipped for builders, transport and removals companies, rental fleets and online retailers. Designed and engineered in Sydney.`;

function Lines({ lines }: { lines: readonly (string | { accent: string })[] }) {
  return lines.map((line, index) => {
    const text = typeof line === "string" ? line : line.accent;
    return (
      <span className="ruby-line" key={text} style={{ "--line": index } as CSSProperties}>
        <span>{typeof line === "string" ? text : <em>{text}</em>}</span>
      </span>
    );
  });
}

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main id="main-content" className="cinematic-home cinema-page ruby-page">
          <RubyMotion />
          <div className="ruby-scroll-progress" aria-hidden="true" />
          <section className="cinema-hero ruby-hero work-first-hero" aria-labelledby="hero-heading" data-ruby-depth data-ruby-magnet>
            <HeroWorkWall />
            <div className="ruby-hero-shade" aria-hidden="true" />
            <div className="ruby-hero-light" aria-hidden="true" />
            <div className="cinema-shell ruby-hero-topline">
              <p className="cinema-label"><span className="ruby-signal" />Independent web studio</p>
              <p className="cinema-label">{siteConfig.location}</p>
            </div>
            <div className="cinema-shell ruby-hero-composition">
              <h1 id="hero-heading" className="ruby-title">
                <span className="ruby-title-row">Websites built for</span>{" "}
                <span className="ruby-title-row ruby-title-row--signature"><em>real businesses.</em></span>
              </h1>
              <div className="ruby-hero-actionline">
                <p>{heroSummary}</p>
                <div className="ruby-hero-actions">
                  <a className="ruby-project-cta" href="#contact"><span>Start your project</span><ArrowIcon /></a>
                  <a className="ruby-ghost-cta" href="#work"><span>See the work</span><ArrowIcon direction="right" /></a>
                </div>
              </div>
            </div>
            <div className="cinema-shell ruby-hero-bottomline">
              <div className="ruby-proof">
                <Link href="/work" prefetch={false} className="ruby-proof-index"><strong>{projects.length}</strong><span>Case studies</span></Link>
                <ul role="list" aria-label="Selected case studies">
                  {proofProjects.map(project => (
                    <li key={project.slug}>
                      <Link href={`/work/${project.slug}`} prefetch={false} aria-label={project.name}>
                        <ProjectArtwork project={project} sizes="90px" decorative />
                        <span aria-hidden="true">{project.titleName ?? project.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="ruby-service-ticker" aria-label="Studio capabilities">
            <TickerToggle />
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
              {deviceProject && phoneCapture && (
                <figure className="ruby-device-study">
                  <div className="ruby-device-laptop"><div className="ruby-device-screen">
                    <ProjectArtwork project={deviceProject} sizes="(max-width: 720px) 82vw, 35vw" />
                  </div></div>
                  <div className="ruby-device-phone">
                    <Image src={phoneCapture.src} alt={phoneCapture.alt} width={390} height={844} sizes="(max-width: 720px) 24vw, 11vw" />
                  </div>
                  <figcaption><Link href={`/work/${deviceProject.slug}`} prefetch={false}>{deviceProject.name} <ArrowIcon /></Link><span>Desktop / Mobile</span></figcaption>
                </figure>
              )}
              <div className="ruby-positioning-copy">
                <Reveal as="h2" id="perspective-heading" className="ruby-statement ruby-lines">
                  <Lines lines={["Designed to look", "the part.", { accent: "Built to win" }, "the enquiry."]} />
                </Reveal>
                <div className="ruby-positioning-bottom">
                  <Reveal as="p">Every project starts with how your customers decide: what they need to see, trust and do before they call. We design that path, build it on modern web technology and hand over a site your business can grow with.</Reveal>
                  <Link href="/about" prefetch={false} className="cinema-link">The studio behind the work <ArrowIcon /></Link>
                </div>
              </div>
            </div>
          </section>

          <PortfolioSection />

          <section className="ruby-capabilities" aria-labelledby="capability-heading">
            <div className="cinema-shell ruby-capability-grid">
              <div className="ruby-capability-intro">
                <p className="cinema-label">Engineering</p>
                <h2 id="capability-heading">Built on modern foundations.</h2>
                <p>Technology choices drawn from the work, not a wishlist.</p>
              </div>
              <div className="ruby-capability-stack">
                <p><CapabilityCount value={documentedStack.length} /> tools from our case studies</p>
                <ul aria-label="Documented project technologies">{documentedStack.map(tool => <li key={tool}>{tool}</li>)}</ul>
              </div>
            </div>
          </section>

          <section id="services" className="ruby-services" aria-labelledby="services-heading">
            <div className="cinema-shell">
              <header className="ruby-section-header">
                <Reveal as="h2" id="services-heading" className="ruby-lines"><Lines lines={["Design & development."]} /></Reveal>
                <p>Design that earns attention.<br />Technology that does the work.</p>
              </header>
              <ol className="ruby-disciplines" aria-label="Service pillars">
                {serviceDisciplines.map((discipline, index) => (
                  <li key={discipline.name}>
                    <details name="studio-services" open={index === 0}>
                      <summary className="ruby-discipline">
                        <span className="cinema-label ruby-discipline-number">{String(index + 1).padStart(2, "0")}</span>
                        <h3 className="ruby-discipline-title">{discipline.name}</h3>
                        <span className="ruby-discipline-copy">{discipline.description}</span>
                        <span className="ruby-discipline-arrow" aria-hidden="true" />
                      </summary>
                      <ul className="ruby-service-options">
                        {discipline.services.map(slug => {
                          const service = findService(slug);
                          if (!service) throw new Error(`Unknown homepage service slug: ${slug}`);
                          return (
                            <li key={service.slug}>
                              <Link href={`/services/${service.slug}`} prefetch={false}>{service.title}</Link>
                              <Link className="ruby-service-enquire" href={serviceContactHref(service)} prefetch={false} aria-label={`Enquire about ${service.title}`}>Enquire <ArrowIcon direction="right" /></Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <ProcessSection />

          <div className="ruby-contact">
            <EnquirySection id="contact" showIndex={false} showNextSteps><ContactForm /></EnquirySection>
          </div>
        </main>
      </PageTransition>
      <SiteFooter currentYear={currentYear} home />
    </>
  );
}
