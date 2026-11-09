import Link from "next/link";
import { PageTransition } from "./components/motion/PageTransition";
import { ContactForm } from "./components/ContactForm";

import { findProject, projects, type Project } from "./project-data";
import { findService } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon } from "./icons";

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
  {
    number: "07",
    slug: "custom-software-business-systems",
    title: "Custom software & business systems",
    description:
      "Role-protected web applications, inventory platforms and internal tools built around the workflows your team runs every day.",
    details: ["Inventory & purchasing", "Staff portals", "Integrations & automation"],
  },
] as const;

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



export default function AgencyHome({ currentYear }: { currentYear: number }) {
  const featuredProject = projects[0];

  return (
    <>
      <SiteHeader />

      <PageTransition>
      <main id="main-content">
        {/* Hero - Light Editorial */}
        <section className="stage-hero" aria-labelledby="hero-heading">
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
            <div className="stage-foot">
              <div className="stage-intro">
                <h1 id="hero-heading" className="stage-title">
                  <span className="stage-line">Good design.</span>
                  <span className="stage-line">Real business impact.</span>
                </h1>

                <p className="stage-tagline">Websites, online stores and custom software for Australian businesses.</p>
                <p className="hero-intro">
                  We build digital experiences that do the selling — thoughtful design, clear customer journeys and technology that supports your daily work.
                </p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#contact" data-magnetic>
                    Start Your Project <ArrowIcon />
                  </a>
                  <Link className="button button-ghost" href="/work" prefetch={false} data-magnetic>
                    Explore Our Work <ArrowIcon direction="down-right" />
                  </Link>
                </div>
                <div className="stage-confidence" aria-label="Explore the studio or call directly">
                  <Link href="/work" prefetch={false}>{projects.length} project case studies <ArrowIcon /></Link>
                  <a href={`tel:${siteConfig.phoneInternational}`}>Prefer a conversation? {siteConfig.phoneDisplay}</a>
                </div>
              </div>

              <div className="stage-hero-visual" aria-hidden="true">
                <figure className="service-hero-visual">
                  <div className="service-hero-visual-frame">
                    <img
                      src={featuredProject.image}
                      alt={`${featuredProject.name} homepage`}
                      loading="eager"
                      width={1348}
                      height={926}
                    />
                  </div>
                  <figcaption>
                    <span>Studio project</span>
                    {featuredProject.name}
                  </figcaption>
                </figure>
              </div>
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
                <span>Web design</span><i aria-hidden="true">/</i><span>Development</span><i aria-hidden="true">/</i><span>Business systems</span><i aria-hidden="true">/</i><span>AI + automation</span><i aria-hidden="true">/</i><span>Performance</span><i aria-hidden="true">/</i>
              </div>
              <div className="hero-marquee-group" aria-hidden="true">
                <span>Web design</span><i>/</i><span>Development</span><i>/</i><span>Business systems</span><i>/</i><span>AI + automation</span><i>/</i><span>Performance</span><i>/</i>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Work */}
        <section id="work" className="portfolio-section" aria-labelledby="work-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">01</span><span className="micro-rule" aria-hidden="true" />Selected work</p>
              <h2 id="work-heading" className="display-xl">Websites and systems <span className="accent-serif">that deliver.</span></h2>
              <p>Every project started with a business goal and ended with a measurable result.</p>
            </div>
            <div className="portfolio-grid">
              {projects.slice(0, 6).map((project) => (
                <Link key={project.slug} href={`/work/${project.slug}`} className="portfolio-card" data-reveal>
                  <img
                    src={project.image}
                    alt={`${project.name} homepage`}
                    loading="lazy"
                    width={1348}
                    height={926}
                  />
                  <div className="portfolio-card-overlay">
                    <span className="portfolio-card-sector">{project.sector}</span>
                    <h3 className="portfolio-card-title">{project.name}</h3>
                    <span className="portfolio-card-link">View case study <ArrowIcon /></span>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
              <Link href="/work" className="button button-ghost" data-magnetic>
                View all {projects.length} projects <ArrowIcon direction="right" />
              </Link>
            </div>
          </div>
        </section>

        {/* Virtual Studio Preview */}
        <section className="virtual-studio-preview" aria-labelledby="studio-heading">
          <video
            className="virtual-studio-media"
            autoPlay
            loop
            muted
            playsInline
            poster="/studio/r2/screens/247-inventory-system@2x.webp"
          >
            <source src="/studio/r2/room-environment.bin" type="application/octet-stream" />
          </video>
          <div className="virtual-studio-overlay">
            <h2 id="studio-heading">Step inside the studio</h2>
            <p>An interactive 3D environment showing how we design, build and ship digital products.</p>
            <Link href="/studio" className="button button-lime" data-magnetic>
              Enter the Virtual Studio <ArrowIcon direction="right" />
            </Link>
          </div>
        </section>

        {/* Brand Film */}
        <section className="brand-film-section" id="film" aria-labelledby="film-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">02</span><span className="micro-rule" aria-hidden="true" />Brand film</p>
              <h2 id="film-heading" className="display-xl">A studio <span className="accent-serif">in motion.</span></h2>
              <p>Watch our process, philosophy and the spaces where ideas take shape.</p>
            </div>
            <div className="film-player" data-reveal>
              <video
                poster="/brand/brand-film-poster.webp"
                preload="none"
                playsInline
                muted
              >
                <source src="/brand/brand-film.webm" type="video/webm" />
                <source src="/brand/brand-film.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="services-section" aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">03</span><span className="micro-rule" aria-hidden="true" />Services</p>
              <h2 id="services-heading" className="display-xl">From first impression to <span className="accent-serif">everyday operation.</span></h2>
              <p>From the first strategic decision to post-launch support, every recommendation is tied to a clear business goal.</p>
            </div>
            <div className="service-index">
              {serviceRows.map((service) => (
                <Link key={service.number} href={`/services/${service.slug}`} className="service-card" data-reveal>
                  <span className="service-card-index">{service.number}</span>
                  <h3>{service.title}</h3>
                  <div className="gr-service-body">
                    <p className="gr-service-desc">{service.description}</p>
                    <div className="gr-service-tags">
                      {service.details.map((detail) => <span key={detail}>{detail}</span>)}
                    </div>
                  </div>
                  <span className="service-card-arrow" aria-hidden="true"><ArrowIcon /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="process-section" aria-labelledby="process-heading">
          <div className="container process-layout">
            <div className="process-intro" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">04</span><span className="micro-rule" aria-hidden="true" />How we work</p>
              <h2 id="process-heading" className="display-l">A clear path from ambition to <span className="accent-serif">launch.</span></h2>
              <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
              <a className="text-link" href="#contact">Start Your Project <ArrowIcon /></a>
            </div>
            <ol className="process-list">
              {processSteps.map(([number, title, description]) => (
                <li key={number} data-process-step data-reveal>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  <span aria-hidden="true"><ArrowIcon direction="down-right" /></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Stack Ledger */}
        <section className="stack-ledger" aria-labelledby="ledger-heading">
          <div className="container">
            <p className="sr-only" id="ledger-heading">Studio metrics</p>
            <div className="ledger-item">
              <div className="ledger-number">{projects.length}</div>
              <div className="ledger-label">Projects delivered</div>
            </div>
            <div className="ledger-item">
              <div className="ledger-number">{services.length}</div>
              <div className="ledger-label">Core services</div>
            </div>
            <div className="ledger-item">
              <div className="ledger-number">7</div>
              <div className="ledger-label">Sectors served</div>
            </div>
            <div className="ledger-item">
              <div className="ledger-number">1</div>
              <div className="ledger-label">Studio in Sydney</div>
            </div>
          </div>
        </section>

        {/* AB Standard */}
        <section className="standard-section" aria-labelledby="standard-heading">
          <div className="container standard-layout">
            <div className="standard-statement" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">05</span><span className="micro-rule" aria-hidden="true" />The AB standard</p>
              <h2 id="standard-heading" className="display-l">Feel the quality. <span className="accent-serif">Then see the thinking.</span></h2>
            </div>
            <div className="standard-points">
              <article data-reveal>
                <span>01 / Show</span>
                <h3>Show the work first.</h3>
                <p>Visitors understand who you help, what you offer and why your business is worth choosing.</p>
              </article>
              <article data-reveal>
                <span>02 / Explain</span>
                <h3>Explain the business value.</h3>
                <p>Information hierarchy and calls to action work together to turn attention into genuine enquiries.</p>
              </article>
              <article data-reveal>
                <span>03 / Guide</span>
                <h3>Keep the next step obvious.</h3>
                <p>Responsive, accessible, <Link href="/services/seo-local-visibility">search-ready website foundations</Link> engineered to feel fast on the devices customers actually use.</p>
              </article>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="studio-about" aria-labelledby="about-heading">
          <div className="container">
            <div className="studio-about-header" data-reveal>
              <p className="eyebrow section-index"><span className="section-index-num">06</span><span className="micro-rule" aria-hidden="true" />About the studio</p>
              <h2 id="about-heading" className="display-xl">AB Web Studio. <span className="accent-serif">Independent by design.</span></h2>
              <p className="lead">A Sydney digital studio creating websites and custom software for Australian businesses with thoughtful design and practical technology.</p>
            </div>
            <div className="studio-about-grid">
              <article className="about-card" data-reveal>
                <h3>Design</h3>
                <p>Positioning, content hierarchy and a visual direction shaped around the business behind the brief — never a generic template dressed in your colours.</p>
              </article>
              <article className="about-card" data-reveal>
                <h3>Development</h3>
                <p>Responsive web applications and digital products built around the way your business works, with accessibility-conscious implementation and technical SEO foundations.</p>
              </article>
              <article className="about-card" data-reveal>
                <h3>Systems</h3>
                <p>Inventory, purchasing, sales and invoicing workflows brought together in practical custom software when a website alone is not enough.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="enquiry-section" aria-labelledby="contact-heading">
          <div className="container">
            <div className="studio-shell studio-split studio-split--enquiry">
              <div className="enquiry-copy">
                <p className="eyebrow section-index" data-reveal><span className="section-index-num">07</span><span className="micro-rule" aria-hidden="true" />Start a conversation</p>
                <h2 id="contact-heading" className="display-xl">Let&apos;s build your next <em>digital advantage.</em></h2>
                <p className="lead" data-reveal>Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>
                <ul className="studio-contact-rows" data-reveal aria-label="Contact directly">
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
                    <a href={`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
                      <span className="studio-contact-label">WhatsApp</span>
                      <strong>Message directly</strong>
                      <ArrowIcon />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                </ul>
                <p className="enquiry-location">{siteConfig.location} <i aria-hidden="true">/</i> Working Australia-wide</p>
              </div>

              <div className="enquiry-form" data-reveal>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      </PageTransition>

      <SiteFooter currentYear={currentYear} />
    </>
  );
}