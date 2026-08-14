import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "./components/ContactForm";
import { Hero3DExperience } from "./components/Hero3DExperience";
import { ProjectShowcase } from "./components/ProjectShowcase";
import { ProjectArtwork } from "./project-artwork";
import { projects } from "./project-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { assetBase, siteConfig } from "./site-config";
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
] as const;

const processSteps = [
  ["01", "Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["02", "Plan", "We map the content, page structure and customer journey before visual design begins."],
  ["03", "Design & build", "We create, refine and develop the experience responsively, with clear review points."],
  ["04", "Launch & support", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-heading">
          <Hero3DExperience />
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy" data-reveal>
              <p className="eyebrow"><span className="eyebrow-mark" /> Sydney studio · Australia-wide</p>
              <h1 id="hero-heading">
                Websites that make your business <em>impossible to ignore.</em>
              </h1>
              <p className="hero-intro">
                <Link href="/services/web-design-sydney">Strategy-led website design</Link>, clear messaging and dependable development—built into a digital presence that earns attention and creates action.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  Start a Project <ArrowIcon />
                </a>
                <a className="button button-ghost" href="#work">View Our Work</a>
              </div>
              <div className="client-proof" aria-label="Selected client work">
                <span>Live client work</span>
                <ul>
                  <li>Maple Rentals</li>
                  <li>DECENT Development</li>
                  <li>ZQ Removals</li>
                </ul>
                <a href="#work">Explore seven live websites <ArrowIcon /></a>
              </div>
            </div>

            <ProjectShowcase />
          </div>

          <div className="hero-marquee" aria-label="Core capabilities">
            <div className="hero-marquee-track">
              <div className="hero-marquee-group">
                <span>Strategy</span><i>✦</i><span>Design</span><i>✦</i><span>Development</span><i>✦</i><span>SEO</span><i>✦</i><span>Growth</span><i>✦</i>
              </div>
              <div className="hero-marquee-group" aria-hidden="true">
                <span>Strategy</span><i>✦</i><span>Design</span><i>✦</i><span>Development</span><i>✦</i><span>SEO</span><i>✦</i><span>Growth</span><i>✦</i>
              </div>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services" aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">01 / Capabilities</p>
                <h2 id="services-heading">One studio. Every digital detail aligned.</h2>
              </div>
              <p>From the first strategic decision to post-launch support, every recommendation is tied to a clear business goal.</p>
            </div>
            <div className="services-grid">
              {services.map((service) => (
                <a className="service-card" data-reveal key={service.number} href={`/services/${service.slug}`}>
                  <div className="service-card-top">
                    <span>{service.number}</span>
                    <span aria-hidden="true">↘</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                  <span className="service-link">Explore service <ArrowIcon /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <aside className="conversion-banner" data-reveal aria-label="Book a consultation">
          <div className="container conversion-banner-layout">
            <div className="conversion-banner-copy">
              <p className="eyebrow">Strategy & Position</p>
              <h3>Ready for a website that elevates your market positioning and converts visits into enquiries?</h3>
            </div>
            <div className="conversion-banner-actions">
              <a className="button button-primary" href="#contact">
                Start a Project <ArrowIcon />
              </a>
              <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>
                Call {siteConfig.phoneDisplay}
              </a>
            </div>
          </div>
        </aside>

        <section className="section work-section" id="work" aria-labelledby="work-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">02 / Selected work</p>
                <h2 id="work-heading">Built for real businesses. Live in the real world.</h2>
              </div>
              <p>Seven responsive digital experiences across mobility, logistics, local services, construction and property.</p>
            </div>
            <div className="work-grid">
              {projects.map((project, index) => (
                <Link
                  className="project-card"
                  data-reveal
                  href={`/work/${project.slug}`}
                  key={project.name}
                  aria-label={`${project.name} — View Case Study`}
                >
                  <div className="project-image">
                    <ProjectArtwork
                      project={project}
                      sizes="(max-width: 720px) 94vw, (max-width: 1100px) 47vw, 31vw"
                    />
                    <span className="live-label"><i /> Live website</span>
                    <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="project-details">
                    <p>{project.category}</p>
                    <div><h3>{project.name}</h3><ArrowIcon /></div>
                    <span>{project.description}</span>
                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className="project-tag-pill">{tag}</span>
                      ))}
                    </div>
                    <span className="project-cta">View Case Study <ArrowIcon /></span>
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
        </section>

        <section className="standard-section" aria-labelledby="standard-heading">
          <div className="container standard-layout">
            <div className="standard-statement" data-reveal>
              <p className="eyebrow">The AB standard</p>
              <h2 id="standard-heading">Premium is not decoration. It is how the entire experience performs.</h2>
            </div>
            <div className="standard-points">
              <article data-reveal><span>Position</span><h3>Say the right thing clearly.</h3><p>Visitors understand who you help, what you offer and why your business is worth choosing.</p></article>
              <article data-reveal><span>Guide</span><h3>Make every next step obvious.</h3><p>Information hierarchy and calls to action work together to turn attention into genuine enquiries.</p></article>
              <article data-reveal><span>Perform</span><h3>Launch on strong foundations.</h3><p>Responsive, accessible, <Link href="/services/seo-local-visibility">search-ready website foundations</Link> engineered to feel fast on the devices customers actually use.</p></article>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about" aria-labelledby="about-heading">
          <div className="container about-layout">
            <div className="about-logo" data-reveal>
              <div className="about-logo-ring" aria-hidden="true" />
              <Image
                src={`${assetBase}/ab-logo-lockup.png`}
                alt="AB Digital Solutions — We build your online success"
                width={1020}
                height={500}
                sizes="(max-width: 960px) 70vw, 28vw"
              />
              <span>Sydney / Australia</span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="eyebrow">04 / About AB</p>
              <h2 id="about-heading">Your digital presence should work as hard as you do.</h2>
              <p>AB Digital Solutions is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.</p>
              <div className="studio-trust" aria-label="Studio details">
                <p><strong>Abubakar Asif</strong><span>Founder &amp; Lead Developer</span></p>
                <p><strong>Sydney, Australia</strong><span>Working Australia-wide</span></p>
                <p><strong>Real project portfolio</strong><span>Seven live website case studies</span></p>
              </div>
              <p>We create digital experiences that look considered, feel effortless to use and give your business a stronger platform for sustainable growth.</p>
              <p>Every engagement is shaped around the business behind the brief: the people you need to reach, the proof they need to see and the next step they should feel confident taking. The result is a distinctive website with a clear commercial purpose, not a generic template dressed in your colours.</p>
              <dl className="about-values">
                <div><dt>Clear communication</dt><dd>Simple advice and transparent decisions.</dd></div>
                <div><dt>Reliable delivery</dt><dd>A professional process from brief to launch.</dd></div>
                <div><dt>Results-focused work</dt><dd>Design choices connected to business goals.</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-heading">
          <div className="contact-word" aria-hidden="true">HELLO</div>
          <div className="container contact-layout">
            <div className="contact-copy" data-reveal>
              <p className="eyebrow">05 / Start a conversation</p>
              <h2 id="contact-heading">Have a project in mind? Let&apos;s make it count.</h2>
              <p>Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>
              <div className="contact-options">
                <a href={`tel:${siteConfig.phoneInternational}`}><span>Call</span><strong>{siteConfig.phoneDisplay}</strong><ArrowIcon /></a>
                <a href={`mailto:${siteConfig.email}`}><span>Email</span><strong>{siteConfig.email}</strong><ArrowIcon /></a>
                <a href={`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`} target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>Message directly</strong><ArrowIcon /><span className="sr-only"> (opens in a new tab)</span></a>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter currentYear={currentYear} />
    </>
  );
}
