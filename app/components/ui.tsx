import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "../icons";
import { ProjectArtwork, projectArtworkRatio } from "../project-artwork";
import { projectDestinationLabel, projectDisplayDomain, type Project } from "../project-data";
import { siteConfig } from "../site-config";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";

/** Header, main landmark and footer shared by every marketing route. */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={className}>{children}</main>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbSchema(trail: readonly (readonly [string, string])[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Home", ""], ...trail].map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${siteConfig.url}${path}`,
    })),
  };
}

/** Visible breadcrumb. The last entry is the current page. */
export function Crumbs({ trail }: { trail: readonly (readonly [string, string])[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {trail.map(([name, path], index) => (
        <span key={path} style={{ display: "contents" }}>
          <span aria-hidden="true">/</span>
          {index === trail.length - 1 ? <span aria-current="page">{name}</span> : <Link href={path}>{name}</Link>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHead({ label, title, id, children }: { label: string; title: ReactNode; id: string; children?: ReactNode }) {
  return (
    <div className="section-head" data-reveal>
      <div>
        <p className="label">{label}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

const destinationKind = (project: Project) =>
  project.destination === "unavailable" ? "offline" : project.destination === "hosted-showcase" ? "showcase" : project.kind === "software" ? "system" : "live";

/** States whether a project is a live site, a hosted showcase or a protected system. */
export function DestinationChip({ project }: { project: Project }) {
  return <span className="chip chip--status" data-kind={destinationKind(project)}>{projectDestinationLabel(project)}</span>;
}

/** Real project capture inside a browser frame. */
export function ProjectFrame({ project, sizes, priority = false, natural = false }: { project: Project; sizes: string; priority?: boolean; natural?: boolean }) {
  return (
    <span className="frame">
      <span className="frame-bar" aria-hidden="true"><i /><i /><i /><span>{projectDisplayDomain(project)}</span></span>
      <span className="frame-media" style={natural ? { aspectRatio: projectArtworkRatio(project) } : undefined}>
        <ProjectArtwork project={project} sizes={sizes} priority={priority} />
      </span>
    </span>
  );
}

/** Portfolio entry that always routes through its case study. */
export function WorkItem({ project, sizes, className = "", priority = false }: { project: Project; sizes: string; className?: string; priority?: boolean }) {
  return (
    <Link className={`work-item ${className}`.trim()} href={`/work/${project.slug}`}>
      <ProjectFrame project={project} sizes={sizes} priority={priority} />
      <span className="work-meta"><span>{project.sector}</span><DestinationChip project={project} /></span>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <span className="work-cue">View case study <ArrowIcon /></span>
    </Link>
  );
}

export const processSteps = [
  ["Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["Design", "We map the content, page structure and customer journey before visual design begins."],
  ["Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

export function ProcessRail({ steps = processSteps }: { steps?: readonly (readonly [string, string])[] }) {
  return (
    <ol className="rail">
      {steps.map(([title, copy], index) => (
        <li key={title} data-reveal style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}>
          <span className="rail-num">{String(index + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{copy}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="faq">
      {items.map(({ question, answer }) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ id, label = "Start a project", title, children, href = "/contact", cta = "Start a project" }: { id: string; label?: string; title: ReactNode; children?: ReactNode; href?: string; cta?: string }) {
  return (
    <aside className="cta-band" aria-labelledby={id}>
      <div className="shell cta-band-inner" data-reveal>
        <p className="label">{label}</p>
        <h2 id={id}>{title}</h2>
        {children ? <p className="lead">{children}</p> : null}
        <div className="actions">
          <Link className="button button-primary" href={href}>{cta} <ArrowIcon /></Link>
          <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
        </div>
      </div>
    </aside>
  );
}

/** Direct contact routes shown beside the enquiry form. */
export function EnquiryAside({ headingAs: Heading = "h2", id }: { headingAs?: "h1" | "h2"; id: string }) {
  return (
    <div className="enquiry-aside">
      <p className="label">Start a project</p>
      <Heading id={id}>Tell us what you are building.</Heading>
      <p className="lead">Share the business, the goal and anything you already have. We reply with a practical next step, and a fixed-price written proposal before any work begins.</p>
      <dl className="enquiry-direct">
        <div><dt>Phone</dt><dd><a href={`tel:${siteConfig.phoneInternational}`}>{siteConfig.phoneDisplay}</a></dd></div>
        <div><dt>Email</dt><dd><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></dd></div>
        <div><dt>Based in</dt><dd>{siteConfig.location}</dd></div>
      </dl>
    </div>
  );
}
