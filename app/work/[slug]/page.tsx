import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectArtwork, projectArtworkRatio } from "../../project-artwork";
import { findProject, formatCategory, isSoftwareProject, projects } from "../../project-data";
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
  const approachHeading = `${project.tags[0]} for ${project.name}`;
  // Three presentations share one system so consecutive case studies never
  // feel identical: live software gets a dark system frame, websites
  // alternate between a cinematic full-width hero and an editorial split.
  const variant = softwareProject ? "system" : currentIndex % 2 === 0 ? "cinematic" : "split";
  const visitLabel = `Visit ${project.name} ${softwareProject ? "system" : "live website"} (opens in a new tab)`;

  return (
    <>
      <SiteHeader />
      <main className={`content-page case-study-page gr-cs gr-cs--${variant}`} id="main-content">
        <header className="container gr-cs-hero">
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/work">Work</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{project.name}</span>
          </nav>

          <div className="gr-cs-hero-grid">
            <div className="gr-cs-hero-copy">
              <p className="eyebrow">Case study <span className="gr-kicker-num">{number}</span> / {total}</p>
              <h1>{project.name}</h1>
              <p className="content-lead">{project.description}</p>
              <div className="content-actions">
                <a
                  className="button button-primary"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="VISIT"
                  data-magnetic
                  aria-label={visitLabel}
                >
                  {project.ctaLabel ?? "View Live Website"} <ArrowIcon />
                </a>
                <Link className="button button-ghost" href="/contact" data-magnetic>
                  Start a Project <ArrowIcon />
                </Link>
              </div>
            </div>
            <span className="gr-number gr-cs-number" aria-hidden="true">{number}</span>
          </div>

          <div className="case-study-meta gr-cs-meta" data-reveal>
            <div><span>Sector</span><strong>{project.sector}</strong></div>
            <div><span>Category</span><strong>{formatCategory(project.category)}</strong></div>
            <div><span>Stack</span><strong>{project.techStack.join(" · ")}</strong></div>
            <div>
              <span>{softwareProject ? "Production URL" : "Live at"}</span>
              <a href={project.url} target="_blank" rel="noopener noreferrer" data-cursor="VISIT" aria-label={visitLabel}>
                {project.displayUrl} <ArrowIcon />
              </a>
            </div>
          </div>
        </header>

        <div className="gr-cs-hero-media">
          <div className="container">
            <div className="browser-frame">
              <div className="browser-bar" aria-hidden="true">
                <i /><i /><i />
                <span>{project.displayUrl}</span>
              </div>
              <div className="case-study-hero-image" style={{ aspectRatio: projectArtworkRatio(project) }}>
                <ProjectArtwork project={project} priority sizes="(max-width: 1040px) 100vw, 1440px" />
              </div>
            </div>
          </div>
        </div>

        <section className="container gr-cs-story" aria-label="Case study overview and approach">
          <div className="gr-cs-story-block" data-reveal>
            <p className="eyebrow">01 / Overview</p>
            <p className="gr-cs-statement">{project.overview}</p>
          </div>
          <div className="gr-cs-story-block gr-cs-story-block--approach" data-reveal>
            <p className="eyebrow">02 / Approach</p>
            <h2>{approachHeading}</h2>
            <p className="case-study-body-text">{project.solution}</p>
          </div>
        </section>

        <section className="gr-cs-features" aria-labelledby="features-heading">
          <div className="container gr-cs-features-grid">
            <div className="gr-cs-features-head" data-reveal>
              <p className="eyebrow">03 / Key features</p>
              <h2 id="features-heading">{project.name}: <span className="accent-serif">in detail.</span></h2>
              <div className="gr-cs-capabilities">
                <h3>Capabilities</h3>
                <div className="sidebar-tags">
                  {project.tags.map((tag) => <span key={tag} className="project-tag-pill">{tag}</span>)}
                </div>
                <h3>Project technology</h3>
                <div className="sidebar-tech">
                  {project.techStack.map((tech) => <span key={tech} className="tech-pill">{tech}</span>)}
                </div>
              </div>
            </div>
            <ol className="gr-cs-feature-list">
              {project.keyFeatures.map((feature, idx) => (
                <li key={feature} data-reveal>
                  <span className="gr-cs-feature-num" aria-hidden="true">{String(idx + 1).padStart(2, "0")}</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container gr-cs-detail" aria-labelledby="visual-showcase-heading">
          <div className="gr-cs-detail-head" data-reveal>
            <p className="eyebrow">04 / A closer look</p>
            <h2 id="visual-showcase-heading">{softwareProject ? "The public staff-access experience." : `${project.name}, on screen.`}</h2>
          </div>
          <div className="gr-cs-pan gr-cut-lg" style={{ aspectRatio: projectArtworkRatio(project) }} data-reveal>
            <ProjectArtwork project={project} sizes="(max-width: 860px) 100vw, 1440px" />
          </div>
          <p className="gr-cs-pan-caption">{softwareProject ? "Public sign-in capture only. Internal records remain private." : `Desktop homepage capture · ${project.displayUrl}`}</p>
        </section>

        <section className="gr-cs-live" aria-labelledby="live-proof-heading">
          <div className="container gr-cs-live-inner" data-reveal>
            <div>
              <p className="eyebrow">Live digital experience</p>
              <h2 id="live-proof-heading">See {project.name} <span className="accent-serif">in action.</span></h2>
              <p>
                {softwareProject
                  ? "Continue to the secure production system to view its public staff access experience."
                  : "Continue to the client website when you are ready to explore the published experience."}
              </p>
            </div>
            <a
              className="button button-primary"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="VISIT"
              data-magnetic
              aria-label={visitLabel}
            >
              {project.ctaLabel ?? "Visit Live Website"} <ArrowIcon />
            </a>
          </div>
        </section>

        <nav className="next-project-nav gr-cs-next" aria-label="Next Project">
          <Link className="gr-cs-next-link" href={`/work/${nextProject.slug}`} data-cursor="VIEW">
            <div className="container gr-cs-next-inner">
              <div>
                <span className="gr-kicker">Next case study / {String(projects.indexOf(nextProject) + 1).padStart(2, "0")}</span>
                <h2 className="gr-cs-next-title">{nextProject.name}</h2>
                <span className="gr-cs-next-cta">View case study <ArrowIcon /></span>
              </div>
              <div className="gr-cs-next-media" aria-hidden="true">
                <ProjectArtwork project={nextProject} sizes="(max-width: 860px) 92vw, 42vw" />
              </div>
            </div>
          </Link>
        </nav>

        <aside className="gr-final-cta" aria-label="Start your project">
          <div className="container gr-final-cta-inner" data-reveal>
            <p className="eyebrow">Have a project in mind?</p>
            <h2>Let&apos;s create a digital experience with a clear <span className="accent-serif">commercial purpose.</span></h2>
            <div className="content-actions">
              <Link className="button button-primary" href="/contact" data-magnetic>
                Start a Project <ArrowIcon />
              </Link>
              <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>
                Call {siteConfig.phoneDisplay}
              </a>
            </div>
          </div>
        </aside>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      <SiteFooter currentYear={currentYear} />
    </>
  );
}
