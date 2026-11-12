import Link from "next/link";
import type { CSSProperties } from "react";
import { PageTransition } from "./components/motion/PageTransition";
import { ContactForm } from "./components/ContactForm";
import { HeroStage, type StageProject } from "./components/home/HeroStage";
import { WorkIndex, type WorkRow } from "./components/home/WorkIndex";
import { findProject, projectDestinationLabel, projects, type Project } from "./project-data";
import { findService } from "./services/service-data";
import { SiteHeader } from "./site-chrome";
import { SiteFooter } from "./site-footer";
import { siteConfig } from "./site-config";
import { ArrowIcon } from "./icons";
import { StudioCapabilities } from "./components/StudioCapabilities";
import { ProcessBand } from "./components/home/sections/ProcessBand";
import { ServiceInspector, type ServiceRow } from "./components/home/sections/ServiceInspector";
import { StackLedger } from "./components/StackLedger";
import { EnquirySection } from "./components/studio/EnquirySection";
import { StudioAbout } from "./components/studio/StudioAbout";

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

const inspectorRows: ServiceRow[] = serviceRows.map((service) => ({
  number: service.number,
  slug: service.slug,
  title: service.title,
  description: service.description,
  details: service.details,
  project: { name: service.featured.name, sector: service.featured.sector, image: service.featured.image },
}));

const processSteps = [
  ["01", "Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["02", "Design", "We map the content, page structure and customer journey before visual design begins."],
  ["03", "Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["04", "Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

// Six featured projects drive both the WebGL wall and the work index.
const featured = projects.slice(0, 6);
const stageProjects: StageProject[] = featured.map((project) => ({
  slug: project.slug,
  name: project.name,
  image: project.image,
  sector: project.sector,
  stack: [...project.techStack],
  href: `/work/${project.slug}`,
}));
const workRows: WorkRow[] = featured.map((project) => ({
  slug: project.slug,
  name: project.name,
  sector: project.sector,
  destinationLabel: projectDestinationLabel(project as Project),
  stack: [...project.techStack],
  href: `/work/${project.slug}`,
}));

export default function AgencyHome({ currentYear }: { currentYear: number }) {
  return (
    <>
      <SiteHeader />

      <PageTransition>
      <main id="main-content" className="cinematic-home inspector-home">
        <div className="hx-scope">
          <HeroStage projects={stageProjects} />

          <section className="hx-hero" aria-labelledby="hero-heading">
            <div className="hx-copy">
              <p className="hx-eyebrow ix-label"><i aria-hidden="true" />Sydney studio · Australia-wide</p>
              <h1 id="hero-heading" className="hx-title">
                Websites with presence. <span className="hx-sub">Software with <em>purpose.</em></span>
              </h1>
              <p className="hx-lede">
                Premium <Link href="/services/web-design-sydney" prefetch={false}>websites and redesigns</Link>, online stores and custom business systems for Australian businesses. Thoughtful design, clear customer journeys and technology that supports your daily work.
              </p>
              <div className="hx-actions">
                <a className="ix-btn ix-btn--solid" href="#contact">Start a project <ArrowIcon /></a>
                <a className="ix-btn ix-btn--ghost" href="#work">Explore our work <ArrowIcon direction="down-right" /></a>
                <Link className="ix-btn ix-btn--ghost hx-studio-btn" href="/studio" prefetch={false}>
                  Virtual 3D Studio <ArrowIcon direction="right" />
                </Link>
              </div>
              <div className="hx-assure" aria-label="Explore the work or call directly">
                <Link href="/work" prefetch={false}>{projects.length} project case studies <ArrowIcon /></Link>
                <a href={`tel:${siteConfig.phoneInternational}`}>Prefer a conversation? {siteConfig.phoneDisplay}</a>
              </div>
            </div>
          </section>

          <section className="wx" id="work" aria-labelledby="work-heading">
            <div className="wx-inner">
              <div className="wx-head">
                <p className="ix-label">01 · Selected work</p>
                <h2 id="work-heading">The work speaks <em>first.</em></h2>
                <p>{projects.length} responsive websites and custom software projects across grocery, fresh produce, mobility, logistics, local services, construction and property. Move across a project to inspect it.</p>
              </div>
              <WorkIndex rows={workRows} total={projects.length} />
            </div>
          </section>
        </div>

        <StudioCapabilities />

        <section className="sx-svc" aria-labelledby="svc-index-heading">
          <div className="sx-svc-inner">
            <div className="sx-svc-head">
              <p className="ix-label">Service index</p>
              <h2 id="svc-index-heading">The details that bring it <em>together.</em></h2>
            </div>
            <ServiceInspector rows={inspectorRows} />
          </div>
        </section>

        <ProcessBand steps={processSteps} />

        <StackLedger />

        <section className="sx-standard" aria-labelledby="standard-heading">
          <div className="sx-standard-inner">
            <div className="sx-standard-statement">
              <p className="ix-label">05 · The AB standard</p>
              <h2 id="standard-heading">Feel the quality. <em>Then see the thinking.</em></h2>
            </div>
            <ol className="sx-standard-points">
              <li style={{ "--i": 0 } as CSSProperties}><span>01 / Show</span><h3>Show the work first.</h3><p>Visitors understand who you help, what you offer and why your business is worth choosing.</p></li>
              <li style={{ "--i": 1 } as CSSProperties}><span>02 / Explain</span><h3>Explain the business value.</h3><p>Information hierarchy and calls to action work together to turn attention into genuine enquiries.</p></li>
              <li style={{ "--i": 2 } as CSSProperties}><span>03 / Guide</span><h3>Keep the next step obvious.</h3><p>Responsive, accessible, <Link href="/services/seo-local-visibility">search-ready website foundations</Link> engineered to feel fast on the devices customers actually use.</p></li>
            </ol>
          </div>
        </section>

        <StudioAbout id="about" index="06" variant="inspector" />

        <EnquirySection id="contact" index="07" variant="inspector">
          <ContactForm />
        </EnquirySection>
      </main>
      </PageTransition>

      <SiteFooter currentYear={currentYear} />
    </>
  );
}
