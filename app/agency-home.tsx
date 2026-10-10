import Link from "next/link";
import { ContactForm } from "./components/ContactForm";
import { Hero3DExperience } from "./components/Hero3DExperience";
import { LiveTicker } from "./components/LiveTicker";
import { findProject, projects, type Project } from "./project-data";
import { findService } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon, Glyph } from "./icons";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { PortfolioSection } from "./components/PortfolioSection";
import { StudioCapabilities } from "./components/StudioCapabilities";
import { ABBrandImage } from "./components/brand/ABBrandImage";
import { ProcessTimeline } from "./components/motion/ProcessTimeline";
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

// Homepage rows must always point at a canonical service page, and each row
// borrows that page's featured live project as its preview image; fail the
// build loudly if either list drifts. The homepage keeps its own row copy on
// purpose — it is marketing language, not the service-page text.
const serviceRows = services.map((service) => {
  const page = findService(service.slug);
  if (!page) throw new Error(`agency-home: unknown service slug "${service.slug}"`);
  const featured = findProject(page.featuredProject);
  if (!featured) throw new Error(`agency-home: unknown featured project "${page.featuredProject}"`);
  return { ...service, featured: featured as Project };
});

const processSteps = [
  ["01", "Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["02", "Design", "We map the content, page structure and customer journey before visual design begins."],
  ["03", "Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["04", "Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

const tickerItems = projects.slice(0, 6).map(({ slug, name, sector, image }) => ({ slug, name, sector, image }));

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />

      <main id="main-content" className="cinematic-home">
        <section className="stage-hero" aria-labelledby="hero-heading">
          <div className="stage-hero-art" aria-hidden="true">
            <Hero3DExperience />
            <span className="stage-ring stage-ring--outer" />
            <span className="stage-ring stage-ring--inner" />
          </div>

          <div className="container stage-hero-top">
            <p className="eyebrow hero-label">
              <span className="eyebrow-mark" />
              <span className="hero-label-primary">Sydney studio</span>
              <span className="micro-rule" aria-hidden="true" />
              <span className="hero-label-secondary">Australia-wide</span>
            </p>
            <span className="stage-edition" aria-hidden="true">Independent by design.</span>
          </div>

          <div className="container stage-hero-body">
            <h1 id="hero-heading" className="stage-title">
              <span className="stage-line"><span>Websites with</span></span>
              <span className="stage-line"><span>presence.</span></span>
              <span className="stage-line stage-line--ruby"><span className="metal-ruby">Software with</span></span>
              <span className="stage-line stage-line--gilt"><span className="metal-gilt">purpose.</span></span>
            </h1>

            <div className="stage-foot">
              <div className="stage-intro">
                <p className="stage-tagline">Built for your business.</p>
                <p className="hero-intro">
                  Independent design and development for Australian businesses. From distinctive <Link href="/services/web-design-sydney" prefetch={false}>websites</Link> to web applications, business systems and connected workflows.
                </p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#contact" data-magnetic>
                    Start a Project <ArrowIcon />
                  </a>
                  <a className="button button-ghost" href="#work" data-magnetic>
                    Explore Our Work <ArrowIcon direction="down-right" />
                  </a>
                </div>
                <div className="stage-confidence" aria-label="Explore the studio or call directly">
                  <Link href="/work" prefetch={false}>{projects.length} project case studies <ArrowIcon /></Link>
                  <a href={`tel:${siteConfig.phoneInternational}`}>Prefer a conversation? {siteConfig.phoneDisplay}</a>
                </div>
              </div>
              <LiveTicker items={tickerItems} />
            </div>
          </div>

          <div className="container stage-bar">
            <a className="stage-scroll-cue" href="#work"><span className="stage-scroll-line" aria-hidden="true" />Scroll to explore</a>
            <p>Design-led websites · Purpose-built technology</p>
            <Link href="/work">{projects.length} real projects <ArrowIcon /></Link>
          </div>

          <div className="hero-marquee" aria-label="Capabilities">
            <div className="hero-marquee-track">
              <div className="hero-marquee-group">
                <span>Web design</span><i>✳</i><span>Development</span><i>✳</i><span>Business systems</span><i>✳</i><span>AI + automation</span><i>✳</i><span>Performance</span><i>✳</i>
              </div>
              <div className="hero-marquee-group" aria-hidden="true">
                <span>Web design</span><i>✳</i><span>Development</span><i>✳</i><span>Business systems</span><i>✳</i><span>AI + automation</span><i>✳</i><span>Performance</span><i>✳</i>
              </div>
            </div>
          </div>
        </section>

        <PortfolioSection />

        <section className="section ruby-band" id="services" aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow section-index"><span className="section-index-num">02</span><span className="micro-rule" aria-hidden="true" />Capabilities</p>
                <h2 id="services-heading" className="gr-display-xl">From first impression to <span className="accent-serif">everyday operation.</span></h2>
              </div>
              <p>From the first strategic decision to post-launch support, every recommendation is tied to a clear business goal.</p>
            </div>
            <StudioCapabilities />
          </div>
        </section>

        <section className="section services-section gr-services" aria-label="Services">
          <div className="container">
            <div className="gr-service-index">
              <p className="eyebrow supporting-services-label">The details that bring it together</p>
              <ol className="services-list">
                {serviceRows.map((service) => (
                  <li key={service.number}>
                    <Link className="service-card" data-reveal href={`/services/${service.slug}`}>
                      <span className="service-card-index">{service.number}</span>
                      <h3>{service.title}</h3>
                      <span className="gr-service-body">
                        <span className="gr-service-desc">{service.description}</span>
                        <span className="gr-service-tags">
                          {service.details.map((detail) => <span key={detail}>{detail}</span>)}
                        </span>
                      </span>
                      <span className="service-card-arrow" aria-hidden="true"><ArrowIcon /></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="section process-section" id="process" aria-labelledby="process-heading">
          <div className="container process-layout">
            <div className="process-intro" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">03</span><span className="micro-rule" aria-hidden="true" />How we work</p>
              <h2 id="process-heading">A clear path from ambition to <span className="accent-serif">launch.</span></h2>
              <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
              <a className="text-link" href="#contact">Start a Project <ArrowIcon /></a>
            </div>
            <ProcessTimeline>
              <span className="process-rail-fill" aria-hidden="true" />
              <ol className="process-list">
              {processSteps.map(([number, title, description]) => (
                <li data-process-step key={number}>
                  <span>{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  <span aria-hidden="true"><ArrowIcon direction="down-right" /></span>
                </li>
              ))}
              </ol>
            </ProcessTimeline>
          </div>
        </section>

        <section className="standard-section" aria-labelledby="standard-heading">
          <div className="container standard-layout">
            <div className="standard-statement" data-reveal>
              <p className="eyebrow section-index"><span className="eyebrow-mark" />The AB standard</p>
              <h2 id="standard-heading">Feel the quality. <span className="accent-serif">Then see the thinking.</span></h2>
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
              <p className="eyebrow section-index"><span className="section-index-num">04</span><span className="micro-rule" aria-hidden="true" />About AB</p>
              <h2 id="about-heading">Your digital presence should <em>work as hard</em> as you do.</h2>
              <p>AB Web Studio is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.</p>
              <Reveal className="studio-trust" variant="blur" role="group" aria-label="Studio details">
                <p><strong>Abubakar Asif</strong><span>Founder &amp; Lead Developer</span></p>
                <p><strong>Sydney, Australia</strong><span>Working Australia-wide</span></p>
                <p><strong>Real project portfolio</strong><span>{projects.length} digital project case studies</span></p>
              </Reveal>
              <Reveal as="p" variant="blur">We create digital experiences that look considered, feel effortless to use and give your business a stronger platform for sustainable growth.</Reveal>
              <Reveal as="p" variant="blur" delay={90}>Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking. The result is a distinctive website with a clear commercial purpose, not a generic template dressed in your colours.</Reveal>
              <Link className="text-link" href="/about">Inside the studio <ArrowIcon /></Link>
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
              <p className="eyebrow section-index"><span className="section-index-num">05</span><span className="micro-rule" aria-hidden="true" />Start a conversation</p>
              <h2 id="contact-heading" className="contact-title scroll-mask">
                <span className="mask-line"><span>Let’s build your next</span></span>
                <span className="mask-line contact-title-accent"><span>digital advantage.</span></span>
              </h2>
              <p>Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>
              <Reveal className="contact-options" variant="fade-up" delay={120}>
                <a href={`tel:${siteConfig.phoneInternational}`}><span><Glyph icon={Phone} />Call</span><strong>{siteConfig.phoneDisplay}</strong><ArrowIcon /></a>
                <a href={`mailto:${siteConfig.email}`}><span><Glyph icon={Mail} />Email</span><strong>{siteConfig.email}</strong><ArrowIcon /></a>
                <a href={`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`} target="_blank" rel="noopener noreferrer"><span><Glyph icon={MessageCircle} />WhatsApp</span><strong>Message directly</strong><ArrowIcon /><span className="sr-only"> (opens in a new tab)</span></a>
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
