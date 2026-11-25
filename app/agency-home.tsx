import Link from "next/link";
import { ContactForm } from "./components/ContactForm";
import { findService, serviceDisciplines } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { ArrowIcon } from "./icons";
import { PortfolioSection } from "./components/PortfolioSection";
import { HomeStudioFeature } from "./components/HomeStudioFeature";
import { ProcessSection } from "./components/ProcessSection";
import { EnquirySection } from "./components/studio/EnquirySection";
import { HeroWorkWall } from "./components/cinematic/HeroWorkWall";
import "./components/cinematic/work-wall.css";
import { projects, type Project } from "./project-data";
import { ProjectArtwork } from "./project-artwork";
import { siteConfig } from "./site-config";
import { SectionEyebrow } from "./components/SectionEyebrow";
import { HomeServiceGroup } from "./components/HomeServiceGroup";
import { TickerToggle } from "./components/cinematic/TickerToggle";

const proofSlugs = ["jufaja-homes", "on-call-trailers", "247-inventory-system"];
const proofProjects: readonly Project[] = proofSlugs.flatMap(slug => projects.filter(project => project.slug === slug));

const bandWords = ["Websites", "Online stores", "Business systems", "Made in Sydney"] as const;

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="cinematic-home cinema-page ruby-page">
        <section className="cinema-hero ruby-hero work-first-hero home-hero" aria-labelledby="hero-heading">
          <HeroWorkWall />
          <div className="hero-project-inspector" aria-hidden="true">
            {proofProjects.map((project, index) => (
              <div className="hero-project-inspector-view" key={project.slug} data-inspect-index={index}>
                <div className="hero-project-inspector-art">
                  <ProjectArtwork project={project} sizes="(max-width: 900px) 50vw, 28vw" decorative />
                </div>
                <div className="hero-project-inspector-details">
                  <strong>{project.titleName ?? project.name}</strong>
                  <span>{project.techStack.slice(0, 3).join(" / ")}</span>
                </div>
              </div>
            ))}
          </div>
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
              <p>Websites, online stores and custom business systems for Australian businesses. Designed and built in Sydney.</p>
              <div className="ruby-hero-actions">
                <a className="ruby-project-cta" href="#contact"><span>Start a project</span><ArrowIcon /></a>
                <a className="ruby-ghost-cta" href="#work"><span>See our work</span><ArrowIcon direction="right" /></a>
              </div>
            </div>
          </div>
          <div className="cinema-shell ruby-hero-bottomline">
            <div className="ruby-proof">
              <Link href="/work" prefetch={false} className="ruby-proof-index"><strong>{projects.length}</strong><span>Case studies</span></Link>
              <ul role="list" aria-label="Selected case studies">
                {proofProjects.map((project, index) => (
                  <li key={project.slug}>
                    <Link href={`/work/${project.slug}`} prefetch={false} aria-label={project.name} data-project-inspect={index}>
                      <ProjectArtwork project={project} sizes="90px" decorative />
                      <span aria-hidden="true">{project.titleName ?? project.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <PortfolioSection />

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

        <section id="services" className="ruby-services" aria-labelledby="services-heading">
          <div className="cinema-shell">
            <header className="ruby-section-header ruby-services-header">
              <div>
                <SectionEyebrow section="services" />
                <h2 id="services-heading">Services</h2>
              </div>
              <Link className="cinema-link ruby-services-all" href="/services" prefetch={false}>
                Explore all services <ArrowIcon direction="right" />
              </Link>
            </header>
            <ol className="ruby-disciplines" aria-label="Service pillars">
              {serviceDisciplines.map((discipline, index) => (
                <li key={discipline.name}>
                  <HomeServiceGroup title={discipline.name} description={discipline.description} initiallyOpen={index === 0}>
                      {discipline.services.map(slug => {
                        const service = findService(slug);
                        if (!service) throw new Error(`Unknown homepage service slug: ${slug}`);
                        return (
                          <li key={service.slug}>
                            <Link className="ruby-service-row" href={`/services/${service.slug}`} prefetch={false}>
                              <span>{service.title}</span><span className="ruby-service-enquire">Details <ArrowIcon direction="right" /></span>
                            </Link>
                          </li>
                        );
                      })}
                  </HomeServiceGroup>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <ProcessSection />
        <HomeStudioFeature />

        <div className="ruby-contact">
          <EnquirySection id="contact" showIndex={false} showNextSteps before={<SectionEyebrow section="contact" />}><ContactForm simplified /></EnquirySection>
        </div>
      </main>
      <SiteFooter currentYear={currentYear} home />
    </>
  );
}
