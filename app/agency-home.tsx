import Link from "next/link";
import { ContactForm } from "./components/ContactForm";
import { Hero3DExperience } from "./components/Hero3DExperience";
import { ProjectShowcase } from "./components/ProjectShowcase";
import { projects } from "./project-data";
import { findService } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon } from "./icons";
import { PortfolioSection } from "./components/PortfolioSection";
import { StudioCapabilities } from "./components/StudioCapabilities";
import { ABBrandImage } from "./components/brand/ABBrandImage";
import { Reveal } from "./components/motion/Reveal";

const services = [
  {
    number: "01",
    slug: "web-design-sydney",
    title: "Website design & development",
    description:
      "Custom service, portfolio and business websites with sharp positioning, persuasive journeys and a premium finish.",
    details: ["UX & visual design", "Responsive development", "Conversion pathways"],
  },
  {
    number: "02",
    slug: "seo-local-visibility",
    title: "SEO & local visibility",
    description:
      "Search-ready architecture and content foundations designed to help the right customers discover your business.",
    details: ["Technical SEO", "On-page optimisation", "Local search"],
  },
  {
    number: "03",
    slug: "branding-content",
    title: "Branding & content",
    description:
      "A coherent visual direction and confident messaging that make your business easier to recognise, trust and choose.",
    details: ["Brand direction", "Website copy", "Campaign creative"],
  },
  {
    number: "04",
    slug: "ecommerce-website-development",
    title: "E-commerce solutions",
    description:
      "Clear, friction-conscious storefronts that showcase products, simplify purchasing and leave room to scale.",
    details: ["Product catalogues", "Checkout integration", "Mobile commerce"],
  },
  {
    number: "05",
    slug: "digital-marketing",
    title: "Digital marketing",
    description:
      "Focused landing pages and campaigns built to create attention, generate enquiries and support the sales process.",
    details: ["Landing pages", "Lead generation", "Campaign strategy"],
  },
  {
    number: "06",
    slug: "website-maintenance",
    title: "Website care & support",
    description:
      "Practical ongoing support for updates, technical health and continuous improvement after your site goes live.",
    details: ["Content updates", "Technical support", "Growth improvements"],
  },
] as const;

// Homepage card slugs must always point at a canonical service page; fail the
// build loudly if the two lists ever drift apart. The homepage keeps its own
// card copy on purpose — it is marketing language, not the service-page text.
services.forEach((service) => {
  if (!findService(service.slug)) {
    throw new Error(`agency-home: unknown service slug "${service.slug}"`);
  }
});

const processSteps = [
  ["01", "Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["02", "Design", "We map the content, page structure and customer journey before visual design begins."],
  ["03", "Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["04", "Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />

      <main id="main-content" className="cinematic-home">
        <section className="hero" aria-labelledby="hero-heading">
          <Hero3DExperience />
          <div className="container hero-layout">
            <div className="hero-copy" data-reveal>
              <p className="eyebrow"><span className="eyebrow-mark" /> Sydney studio · Australia-wide</p>
              <h1 id="hero-heading" className="hero-title">
                <span className="mask-line"><span>Digital experiences{" "}</span></span>
                <span className="mask-line hero-title-accent"><span>that do the selling{" "}</span></span>
                <span className="mask-line"><span>before you say a word.</span></span>
              </h1>
              <p className="hero-intro">
                Premium <Link href="/services/web-design-sydney">websites</Link>, web applications and business systems. Thoughtfully designed. Dependably built. Made to move your business forward.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact" data-magnetic>
                  Start a Project <ArrowIcon />
                </a>
                <a className="button button-ghost" href="#work" data-magnetic>View Our Work</a>
              </div>
              <div className="client-proof" role="group" aria-label="Selected client work">
                <span>Live client work</span>
                <ul>
                  <li>Maple Rentals</li>
                  <li>DECENT Development</li>
                  <li>ZQ Removals</li>
                </ul>
                <a href="#work">Explore {projects.length} live digital projects <ArrowIcon /></a>
              </div>
            </div>

            <div className="hero-showcase-stack">
              <ProjectShowcase />
            </div>
          </div>

          <div className="container hero-foot" data-reveal>
            <a className="hero-scroll-cue" href="#work">
              <span>Explore</span>
              <span className="hero-scroll-cue-line" aria-hidden="true" />
            </a>
            <p className="hero-stack-note">Independent digital studio · Sydney, Australia</p>
          </div>

          <div className="hero-marquee" aria-label="Capabilities">
            <div className="hero-marquee-track">
              <div className="hero-marquee-group">
                <span>Web design</span><i>/</i><span>Development</span><i>/</i><span>Business systems</span><i>/</i><span>AI + automation</span><i>/</i><span>Performance</span><i>/</i>
              </div>
              <div className="hero-marquee-group" aria-hidden="true">
                <span>Web design</span><i>/</i><span>Development</span><i>/</i><span>Business systems</span><i>/</i><span>AI + automation</span><i>/</i><span>Performance</span><i>/</i>
              </div>
            </div>
          </div>
        </section>

        <PortfolioSection />

        <section className="section services-section" id="services" aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">02 / Capabilities</p>
                <h2 id="services-heading">From first impression to everyday operation.</h2>
              </div>
              <p>From the first strategic decision to post-launch support, every recommendation is tied to a clear business goal.</p>
            </div>
            <StudioCapabilities />
            <p className="eyebrow supporting-services-label">The details that bring it together</p>
            <div className="services-list">
              {services.map((service) => (
                <Link className="service-card" data-glow data-tilt data-reveal key={service.number} href={`/services/${service.slug}`}>
                  <div className="service-card-top">
                    <span>{`// ${service.number}`}</span>
                    <h3>{service.title}</h3>
                    <span className="service-card-arrow" aria-hidden="true">↘</span>
                  </div>
                  <div className="service-card-reveal">
                    <div>
                      <p>{service.description}</p>
                      <ul>
                        {service.details.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                      <span className="service-link">Explore service <ArrowIcon /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section process-section" id="process" aria-labelledby="process-heading">
          <div className="container process-layout">
            <div className="process-intro" data-reveal>
              <p className="eyebrow">03 / How we work</p>
              <h2 id="process-heading">A clear path from ambition to launch.</h2>
              <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
              <a className="text-link" href="#contact">Start a Project <ArrowIcon /></a>
            </div>
            <div className="process-list-wrap" data-reveal>
              <span className="process-rail-fill" aria-hidden="true" />
              <ol className="process-list">
              {processSteps.map(([number, title, description]) => (
                <li data-reveal key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  <span aria-hidden="true">↘</span>
                </li>
              ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="standard-section" aria-labelledby="standard-heading">
          <div className="container standard-layout">
            <div className="standard-statement" data-reveal>
              <p className="eyebrow">The AB standard</p>
              <h2 id="standard-heading">Feel the quality. Then see the thinking.</h2>
            </div>
            <div className="standard-points">
              <article data-reveal><span>01 / Show</span><h3>Show the work first.</h3><p>Visitors understand who you help, what you offer and why your business is worth choosing.</p></article>
              <article data-reveal><span>02 / Explain</span><h3>Explain the business value.</h3><p>Information hierarchy and calls to action work together to turn attention into genuine enquiries.</p></article>
              <article data-reveal><span>03 / Guide</span><h3>Keep the next step obvious.</h3><p>Responsive, accessible, <Link href="/services/seo-local-visibility">search-ready website foundations</Link> engineered to feel fast on the devices customers actually use.</p></article>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about" aria-labelledby="about-heading">
          <div className="container about-layout">
            <div className="about-logo" data-reveal>
              <div className="about-logo-ring" aria-hidden="true" />
              <ABBrandImage full />
              <span>Sydney / Australia</span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="eyebrow">04 / About AB</p>
              <h2 id="about-heading">Your digital presence should <em>work as hard</em> as you do.</h2>
              <p>AB Web Studio is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.</p>
              <Reveal className="studio-trust" variant="blur" role="group" aria-label="Studio details">
                <p><strong>Abubakar Asif</strong><span>Founder &amp; Lead Developer</span></p>
                <p><strong>Sydney, Australia</strong><span>Working Australia-wide</span></p>
                <p><strong>Real project portfolio</strong><span>{projects.length} live digital project case studies</span></p>
              </Reveal>
              <Reveal as="p" variant="blur">We create digital experiences that look considered, feel effortless to use and give your business a stronger platform for sustainable growth.</Reveal>
              <Reveal as="p" variant="blur" delay={90}>Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking. The result is a distinctive website with a clear commercial purpose, not a generic template dressed in your colours.</Reveal>
              <Reveal as="dl" className="about-values" variant="fade-up">
                <div><dt>Clear communication</dt><dd>Simple advice and transparent decisions.</dd></div>
                <div><dt>Reliable delivery</dt><dd>A professional process from brief to launch.</dd></div>
                <div><dt>Results-focused work</dt><dd>Design choices connected to business goals.</dd></div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-heading">
          <div className="contact-word" aria-hidden="true">HELLO</div>
          <div className="container contact-layout">
            <div className="contact-copy" data-reveal>
              <p className="eyebrow">05 / Start a conversation</p>
              <h2 id="contact-heading" className="contact-title scroll-mask">
                <span className="mask-line"><span>Make your next website</span></span>
                <span className="mask-line"><span>impossible to ignore.</span></span>
              </h2>
              <p>Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>
              <Reveal className="contact-options" variant="fade-up" delay={120}>
                <a href={`tel:${siteConfig.phoneInternational}`}><span>Call</span><strong>{siteConfig.phoneDisplay}</strong><ArrowIcon /></a>
                <a href={`mailto:${siteConfig.email}`}><span>Email</span><strong>{siteConfig.email}</strong><ArrowIcon /></a>
                <a href={`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`} target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>Message directly</strong><ArrowIcon /><span className="sr-only"> (opens in a new tab)</span></a>
              </Reveal>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter currentYear={currentYear} />
    </>
  );
}
