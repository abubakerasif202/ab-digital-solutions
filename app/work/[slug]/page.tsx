import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { PageTransition } from "../../components/motion/PageTransition";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Crumbs } from "../../components/inspector/Crumbs";
import { InspectFrame } from "../../components/inspector/InspectFrame";
import { ProjectArtwork, projectArtworkRatio } from "../../project-artwork";
import { findProject, formatCategory, isSoftwareProject, projectDestinationLabel, projectVisitLabel, projects } from "../../project-data";
import { SiteHeader } from "../../site-chrome";
import { SiteFooter } from "../../site-footer";
import { siteConfig } from "../../site-config";
import { ArrowIcon } from "../../icons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = findProject((await params).slug);
  if (!project) return {};
  const projectType = isSoftwareProject(project) ? "software" : "website";
  const title = project.seoTitle ?? `${project.name} Case Study`;
  const description = project.seoDescription ?? project.description;
  return {
    title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `/work/${project.slug}`,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_AU",
      images: [
        {
          url: `/work/${project.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${project.name} ${projectType} case study by ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [`/work/${project.slug}/opengraph-image`],
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: Props) {
  const project = findProject((await params).slug);
  if (!project) notFound();
  const softwareProject = isSoftwareProject(project);

  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const currentYear = new Date().getUTCFullYear();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: `${project.name} ${softwareProject ? "Software" : "Website"} Case Study`,
        description: project.description,
        url: `${siteConfig.url}/work/${project.slug}`,
        author: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Work", item: `${siteConfig.url}/work` },
          {
            "@type": "ListItem",
            position: 3,
            name: project.name,
            item: `${siteConfig.url}/work/${project.slug}`,
          },
        ],
      },
    ],
  };

  const number = String(currentIndex + 1).padStart(2, "0");
  const total = String(projects.length).padStart(2, "0");
  const approachHeading = project.headline ?? `${project.tags[0]} for ${project.name}`;
  // Three presentations share one system so consecutive case studies never
  // feel identical: live software gets a dark system frame, websites
  // alternate between a cinematic full-width hero and an editorial split.
  const variant = project.slug === "wild-pest-solutions" ? "cinematic" : softwareProject ? "system" : currentIndex % 2 === 0 ? "cinematic" : "split";
  const destinationLabel = projectDestinationLabel(project);
  const visitLabel = `${projectVisitLabel(project)} — ${project.name} (opens in a new tab)`;

  return (
    <>
      <SiteHeader />
      <PageTransition>
      <main className={`ip ip-cs ip-cs--${variant} inspector-home${project.slug === "wild-pest-solutions" ? " ip-cs--wild" : ""}`} id="main-content">
        <header className="ip-hero ip-hero--cs">
          <div className="ip-wrap ip-hero-grid ip-hero-grid--cs">
            <div className="ip-hero-copy">
              <Crumbs items={[{ label: "Home", href: "/" }, { label: "Work", href: "/work" }, { label: project.name }]} />
              <p className="ix-label">Case study <span className="ip-label-num">{number}</span> / {total}</p>
              <h1 className="ip-title ip-title--cs">{project.name}</h1>
              <p className="ip-lede">{project.description}</p>
              <div className="ip-actions">
                <a
                  className="ix-btn ix-btn--solid"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={visitLabel}
                >
                  {projectVisitLabel(project)} <ArrowIcon />
                </a>
                <Link className="ix-btn ix-btn--ghost" href="/contact">
                  Get a Website Quote <ArrowIcon />
                </Link>
              </div>
            </div>
            <span className="ip-ghost-num ip-ghost-num--cs" aria-hidden="true">{number}</span>
          </div>

          <div className="ip-wrap">
            <dl className="ip-meta">
              <div><dt>Sector</dt><dd>{project.sector}</dd></div>
              <div><dt>Category</dt><dd>{formatCategory(project.category)}</dd></div>
              <div><dt>{project.region ? "Region" : project.techStack.length ? "Stack" : "Focus"}</dt><dd>{project.region ?? (project.techStack.length ? project.techStack.join(" · ") : project.tags[0])}</dd></div>
              <div>
                <dt>{destinationLabel}</dt>
                <dd>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.displayUrl} (opens in a new tab)`}>
                    {project.displayUrl} <ArrowIcon />
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="ip-cs-media">
          <div className="ip-wrap">
            <div className="ip-window">
              <div className="ip-bar" aria-hidden="true">
                <i /><i /><i />
                <span>{project.displayUrl}</span>
              </div>
              {/* Same name as the work-index card image, so it morphs between them. */}
              <InspectFrame
                src={project.image}
                alt={project.alt}
                ratio={projectArtworkRatio(project)}
                sizes="(max-width: 1040px) 100vw, 1360px"
                priority
                focusable
                transitionName={`project-${project.slug}`}
                caption="inspect · move across the capture"
              />
            </div>
          </div>
        </div>

        <section className="ip-sec" aria-label="Case study overview and approach">
          <div className="ip-wrap ip-story">
            <div className="ip-story-block">
              <p className="ix-label">01 / Overview</p>
              <p className="ip-statement">{project.overview}</p>
            </div>
            <div className="ip-story-block ip-story-block--approach">
              <p className="ix-label">02 / Approach</p>
              <h2 className="ip-h2">{approachHeading}</h2>
              <p className="ip-body">{project.solution}</p>
            </div>
          </div>
        </section>

        <section className="ip-sec ip-sec--line" aria-labelledby="features-heading">
          <div className="ip-wrap ip-split">
            <div className="ip-side">
              <p className="ix-label">03 / Key features</p>
              <h2 id="features-heading" className="ip-h2">{project.name}: <em>in detail.</em></h2>
              <div className="ip-caps">
                <h3>Capabilities</h3>
                <ul className="ip-chips">
                  {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                {project.techStack.length > 0 ? <h3>Project technology</h3> : null}
                <ul className="ip-chips ip-chips--tech">
                  {project.techStack.map((tech) => <li key={tech}>{tech}</li>)}
                </ul>
              </div>
            </div>
            <ol className="ip-features">
              {project.keyFeatures.map((feature, idx) => (
                <li key={feature} style={{ "--i": idx } as CSSProperties}>
                  <span className="ip-feat-no" aria-hidden="true">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="ip-feat-t">{feature}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ip-sec ip-sec--tight" aria-labelledby="visual-showcase-heading">
          <div className="ip-wrap">
            <div className="ip-head">
              <p className="ix-label">04 / A closer look</p>
              <h2 id="visual-showcase-heading" className="ip-h2">{softwareProject ? "The public staff-access experience." : `${project.name}, on screen.`}</h2>
            </div>
            <div className="ip-pan" style={{ aspectRatio: projectArtworkRatio(project) }}>
              <ProjectArtwork project={project} sizes="(max-width: 860px) 100vw, 1360px" />
            </div>
            <p className="ip-caption">{softwareProject ? "Public sign-in capture only. Internal records remain private." : `Desktop homepage capture · ${project.displayUrl}`}</p>
            {project.gallery ? (
              <ul className="ip-gallery" aria-label={`${project.name} website screens`}>
                {project.gallery.map((shot, idx) => (
                  <li key={shot.src} style={{ "--i": idx } as CSSProperties}>
                    <figure>
                      <div className="ip-gallery-frame" style={{ aspectRatio: shot.aspectRatio ?? projectArtworkRatio(project) }}>
                        <Image src={shot.src} alt={shot.alt} fill loading="lazy" sizes="(max-width: 860px) 100vw, 33vw" />
                      </div>
                      <figcaption>{shot.caption}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section className="ip-paper ip-paper--live" aria-labelledby="live-proof-heading">
          <div className="ip-wrap ip-live-grid">
            <div>
              <p className="ix-label">{destinationLabel}</p>
              <h2 id="live-proof-heading" className="ip-h2">See {project.name} <em>in action.</em></h2>
              <p className="ip-paper-lead">
                {project.destination === "unavailable"
                  ? "The external project website was unavailable during our latest check. The case study above documents the delivered work."
                  : project.destination === "hosted-showcase"
                    ? "Explore the hosted website showcase. This address is separate from a verified client production domain."
                    : softwareProject
                  ? "Continue to the secure production system to view its public staff access experience."
                  : "Continue to the client website when you are ready to explore the published experience."}
              </p>
            </div>
            <a
              className="ix-btn sx-btn-ink"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={visitLabel}
            >
              {projectVisitLabel(project)} <ArrowIcon />
            </a>
          </div>
        </section>

        <nav className="ip-next" aria-label="Next Project">
          <Link className="ip-next-link" href={`/work/${nextProject.slug}`}>
            <div className="ip-wrap ip-next-inner">
              <div>
                <span className="ix-label">Next case study / {String(projects.indexOf(nextProject) + 1).padStart(2, "0")}</span>
                <h2 className="ip-next-title">{nextProject.name}</h2>
                <span className="ip-link">View case study <ArrowIcon /></span>
              </div>
              <div className="ip-next-media" aria-hidden="true">
                <ProjectArtwork project={nextProject} sizes="(max-width: 860px) 92vw, 42vw" />
              </div>
            </div>
          </Link>
        </nav>

        <aside className="ip-cta" aria-label="Start your project">
          <div className="ip-wrap ip-cta-grid">
            <div>
              <p className="ix-label">Have a project in mind?</p>
              <h2 className="ip-h2">{project.slug === "wild-pest-solutions" ? <>Let&apos;s build something <em>exceptional.</em></> : <>Let&apos;s create a digital experience with a clear <em>commercial purpose.</em></>}</h2>
            </div>
            <div className="ip-cta-side">
              <div className="ip-actions">
                <Link className="ix-btn ix-btn--solid" href="/contact">
                  Get a Website Quote <ArrowIcon />
                </Link>
                <a className="ix-btn ix-btn--ghost" href={`tel:${siteConfig.phoneInternational}`}>
                  Call {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </aside>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      </PageTransition>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
