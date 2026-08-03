"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { assetBase, siteConfig } from "./site-config";

const projects = [
  {
    name: "Maple Rentals",
    category: "Mobility / Car rentals",
    description: "Premium driver rentals and streamlined online applications.",
    url: "https://www.maplerentals.com.au/",
    displayUrl: "maplerentals.com.au",
    image: `${assetBase}/ab-portfolio-maple-rentals.jpg`,
    alt: "Maple Rentals website homepage preview",
  },
  {
    name: "Gala Rentals",
    category: "Mobility / Car rentals",
    description: "A confident booking experience for weekly car rentals in Sydney.",
    url: "https://www.galarentals.com.au/",
    displayUrl: "galarentals.com.au",
    image: `${assetBase}/ab-portfolio-gala-rentals.jpg`,
    alt: "Gala Rentals website homepage preview",
  },
  {
    name: "ZQ Removals",
    category: "Services / Removals",
    description: "Local-service positioning and a direct path to quote requests.",
    url: "https://zqremovals.au/",
    displayUrl: "zqremovals.au",
    image: `${assetBase}/ab-portfolio-zq-removals.jpg`,
    alt: "ZQ Removals website homepage preview",
  },
  {
    name: "DECENT Development",
    category: "Property / Development",
    description: "A refined digital presence for a Sydney construction business.",
    url: "https://www.decentdevelopment.com.au/",
    displayUrl: "decentdevelopment.com.au",
    image: `${assetBase}/ab-portfolio-decent-development.jpg`,
    alt: "DECENT Development website homepage preview",
  },
  {
    name: "Milestone Development",
    category: "Property / Construction",
    description: "A project-led showcase for residential and commercial construction.",
    url: "https://milestonedevelopment.com.au/",
    displayUrl: "milestonedevelopment.com.au",
    image: `${assetBase}/ab-portfolio-milestone-development.jpg`,
    alt: "Milestone Development website homepage preview",
  },
  {
    name: "4 Point Concrete",
    category: "Construction / Civil",
    description: "Capability-focused presentation for concrete and structural works.",
    url: "https://4-point-concrete-design.vercel.app/",
    displayUrl: "4-point-concrete-design.vercel.app",
    image: `${assetBase}/ab-portfolio-four-point-concrete.jpg`,
    alt: "4 Point Concrete website homepage preview",
  },
] as const;

const services = [
  {
    number: "01",
    title: "Website design & development",
    description:
      "Custom service, portfolio and business websites with sharp positioning, persuasive journeys and a premium finish.",
    details: ["UX & visual design", "Responsive development", "Conversion pathways"],
  },
  {
    number: "02",
    title: "SEO & local visibility",
    description:
      "Search-ready architecture and content foundations designed to help the right customers discover your business.",
    details: ["Technical SEO", "On-page optimisation", "Local search"],
  },
  {
    number: "03",
    title: "Branding & content",
    description:
      "A coherent visual direction and confident messaging that make your business easier to recognise, trust and choose.",
    details: ["Brand direction", "Website copy", "Campaign creative"],
  },
  {
    number: "04",
    title: "E-commerce solutions",
    description:
      "Clear, friction-conscious storefronts that showcase products, simplify purchasing and leave room to scale.",
    details: ["Product catalogues", "Checkout integration", "Mobile commerce"],
  },
  {
    number: "05",
    title: "Digital marketing",
    description:
      "Focused landing pages and campaigns built to create attention, generate enquiries and support the sales process.",
    details: ["Landing pages", "Lead generation", "Campaign strategy"],
  },
  {
    number: "06",
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

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPauseOverride, setSliderPauseOverride] = useState<boolean | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const sliderPaused = sliderPauseOverride ?? prefersReducedMotion;

  useEffect(() => {
    if (sliderPaused) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % projects.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [sliderPaused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("nav-open", menuOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("nav-open");
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const showPreviousSlide = () =>
    setActiveSlide((current) => (current - 1 + projects.length) % projects.length);
  const showNextSlide = () =>
    setActiveSlide((current) => (current + 1) % projects.length);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim();
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone") || "Not supplied"}\nService: ${data.get("service")}\nApprox. budget: ${data.get("budget")}\nIdeal timeline: ${data.get("timeline")}\n\nProject details:\n${data.get("message")}`,
    );

    setFormStatus("Your email app is opening with the enquiry ready to review and send.");
    window.location.assign(`mailto:${siteConfig.email}?subject=${subject}&body=${body}`);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header" id="top">
        <div className="container nav-wrap">
          <a className="brand" href="#top" aria-label="AB Digital Solutions home">
            <Image
              src={`${assetBase}/ab-logo-lockup.png`}
              alt=""
              width={1020}
              height={500}
            />
          </a>

          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="primary-navigation"
            className={`site-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Primary navigation"
          >
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#work" onClick={closeMenu}>Work</a>
            <a href="#process" onClick={closeMenu}>Process</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a className="nav-cta" href="#contact" onClick={closeMenu}>
              Start a project <ArrowIcon />
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy" data-reveal>
              <p className="eyebrow"><span className="eyebrow-mark" /> Sydney studio · Australia-wide</p>
              <h1 id="hero-heading">
                Websites that make your business <em>impossible to ignore.</em>
              </h1>
              <p className="hero-intro">
                Strategy-led design, clear messaging and dependable development—built into a digital presence that earns attention and creates action.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  Book a free consultation <ArrowIcon />
                </a>
                <a className="button button-ghost" href="#work">View selected work</a>
              </div>
              <div className="hero-proof" aria-label="Studio highlights">
                <div><strong>06</strong><span>Live projects featured</span></div>
                <div><strong>AU</strong><span>Built for local business</span></div>
                <div><strong>01</strong><span>Partner from brief to launch</span></div>
              </div>
            </div>

            <div
              className="project-showcase"
              data-reveal
              role="region"
              aria-roledescription="carousel"
              aria-label="Featured website projects"
            >
              <div className="showcase-topline">
                <span>Selected work / 2026</span>
                <span>{String(activeSlide + 1).padStart(2, "0")} — {String(projects.length).padStart(2, "0")}</span>
              </div>
              <div className="browser-frame">
                <div className="browser-bar" aria-hidden="true">
                  <i /><i /><i />
                  <span>{projects[activeSlide].displayUrl}</span>
                </div>
                <div className="showcase-slides" aria-live={sliderPaused ? "polite" : "off"}>
                  {projects.map((project, index) => (
                    <a
                      className={`showcase-slide${index === activeSlide ? " is-active" : ""}`}
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-hidden={index !== activeSlide}
                      tabIndex={index === activeSlide ? 0 : -1}
                      key={project.name}
                      aria-label={`${project.alt} — visit live website (opens in a new tab)`}
                    >
                      <Image
                        src={project.image}
                        alt={project.alt}
                        fill
                        preload={index === 0}
                        sizes="(max-width: 900px) 94vw, 52vw"
                      />
                    </a>
                  ))}
                </div>
              </div>
              <div className="showcase-meta">
                <div>
                  <span>{projects[activeSlide].category}</span>
                  <strong>{projects[activeSlide].name}</strong>
                </div>
                <div className="slider-controls">
                  <button type="button" onClick={showPreviousSlide} aria-label="← Previous project">←</button>
                  <button
                    className="pause-control"
                    type="button"
                    onClick={() => setSliderPauseOverride(!sliderPaused)}
                    aria-label={sliderPaused ? "Play project slideshow" : "Pause project slideshow"}
                  >
                    {sliderPaused ? "Play" : "Pause"}
                  </button>
                  <button type="button" onClick={showNextSlide} aria-label="→ Next project">→</button>
                </div>
              </div>
              <div className="slider-tabs" role="group" aria-label="Choose a featured project">
                {projects.map((project, index) => (
                  <button
                    type="button"
                    key={project.name}
                    className={index === activeSlide ? "is-active" : ""}
                    aria-label={`${String(index + 1).padStart(2, "0")} — show ${project.name}`}
                    aria-current={index === activeSlide ? "true" : undefined}
                    onClick={() => setActiveSlide(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-marquee" aria-label="Core capabilities">
            <div>
              <span>Strategy</span><i>✦</i><span>Design</span><i>✦</i><span>Development</span><i>✦</i><span>SEO</span><i>✦</i><span>Growth</span><i>✦</i>
              <span aria-hidden="true">Strategy</span><i aria-hidden="true">✦</i><span aria-hidden="true">Design</span><i aria-hidden="true">✦</i><span aria-hidden="true">Development</span><i aria-hidden="true">✦</i><span aria-hidden="true">SEO</span><i aria-hidden="true">✦</i><span aria-hidden="true">Growth</span><i aria-hidden="true">✦</i>
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
                <article className="service-card" data-reveal key={service.number}>
                  <div className="service-card-top">
                    <span>{service.number}</span>
                    <span aria-hidden="true">↘</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section work-section" id="work" aria-labelledby="work-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">02 / Selected work</p>
                <h2 id="work-heading">Built for real businesses. Live in the real world.</h2>
              </div>
              <p>Six responsive digital experiences across mobility, local services, construction and property.</p>
            </div>
            <div className="work-grid">
              {projects.map((project, index) => (
                <a
                  className="project-card"
                  data-reveal
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={project.name}
                  aria-label={`${project.alt}. Live website. ${String(index + 1).padStart(2, "0")}. ${project.category}. ${project.name}. ${project.description} Visit ${project.name} live website (opens in a new tab)`}
                >
                  <div className="project-image">
                    <Image
                      src={project.image}
                      alt={project.alt}
                      fill
                      sizes="(max-width: 720px) 94vw, (max-width: 1100px) 47vw, 31vw"
                    />
                    <span className="live-label"><i /> Live website</span>
                    <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="project-details">
                    <p>{project.category}</p>
                    <div><h3>{project.name}</h3><ArrowIcon /></div>
                    <span>{project.description}</span>
                  </div>
                </a>
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
              <a className="text-link" href="#contact">Talk through your project <ArrowIcon /></a>
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
              <article data-reveal><span>Perform</span><h3>Launch on strong foundations.</h3><p>Responsive, accessible, search-ready and engineered to feel fast on the devices customers actually use.</p></article>
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
              />
              <span>Sydney / Australia</span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="eyebrow">04 / About AB</p>
              <h2 id="about-heading">Your digital presence should work as hard as you do.</h2>
              <p>AB Digital Solutions is a Sydney-based digital studio helping ambitious Australian businesses build authority through thoughtful design, clear communication and practical technology.</p>
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
                <a href={`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`} target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>Message directly</strong><ArrowIcon /></a>
              </div>
            </div>

            <form className="contact-form" data-reveal onSubmit={handleSubmit}>
              <div className="form-grid">
                <label htmlFor="first-name">First name <span aria-hidden="true">*</span></label>
                <input id="first-name" name="firstName" type="text" autoComplete="given-name" required />
                <label htmlFor="last-name">Last name <span aria-hidden="true">*</span></label>
                <input id="last-name" name="lastName" type="text" autoComplete="family-name" required />
                <label htmlFor="email">Email <span aria-hidden="true">*</span></label>
                <input id="email" name="email" type="email" autoComplete="email" required />
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" />
                <label htmlFor="service">Service</label>
                <select id="service" name="service" defaultValue="Website design & development">
                  <option>Website design &amp; development</option>
                  <option>SEO &amp; local visibility</option>
                  <option>Branding &amp; content</option>
                  <option>E-commerce solutions</option>
                  <option>Digital marketing</option>
                  <option>Website care &amp; support</option>
                </select>
                <label htmlFor="budget">Approx. budget</label>
                <select id="budget" name="budget" defaultValue="Not selected">
                  <option value="Not selected">Select a range</option>
                  <option>$1,500–$3,000</option>
                  <option>$3,000–$6,000</option>
                  <option>$6,000+</option>
                  <option>Not sure yet</option>
                </select>
                <label htmlFor="timeline">Ideal timeline</label>
                <select id="timeline" name="timeline" defaultValue="Not selected">
                  <option value="Not selected">Select timing</option>
                  <option>As soon as possible</option>
                  <option>Within 1 month</option>
                  <option>Within 2–3 months</option>
                  <option>Just exploring</option>
                </select>
                <label htmlFor="message">Project details <span aria-hidden="true">*</span></label>
                <textarea id="message" name="message" rows={5} required />
              </div>
              <button className="button button-primary" type="submit">Prepare project enquiry <ArrowIcon /></button>
              <p className="form-note">This opens your email app with the details ready to review. No mailing lists. No spam.</p>
              <p className="form-status" role="status" aria-live="polite">{formStatus}</p>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <a className="brand footer-brand" href="#top" aria-label="AB Digital Solutions home">
            <Image src={`${assetBase}/ab-logo-lockup.png`} alt="" width={1020} height={500} />
          </a>
          <p>Premium websites, digital marketing and online growth solutions for Australian businesses.</p>
          <nav aria-label="Footer navigation">
            <a href="#services">Services</a><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a>
          </nav>
        </div>
        <div className="container footer-bottom">
          <small>© {currentYear} AB Digital Solutions. All rights reserved.</small>
          <span>{siteConfig.location} · Australia-wide</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
