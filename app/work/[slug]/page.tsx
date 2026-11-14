import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbSchema, Crumbs, DestinationChip, JsonLd, PageShell, ProjectFrame } from "../../components/ui";
import { ArrowIcon } from "../../icons";
import { projectArtworkRatio } from "../../project-artwork";
import { findProject, formatCategory, isSoftwareProject, projectDestinationLabel, projectVisitLabel, projects } from "../../project-data";
import { siteConfig } from "../../site-config";

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
  const image = `/work/${project.slug}/opengraph-image`;
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
      images: [{ url: image, width: 1200, height: 630, alt: `${project.name} ${projectType} case study by ${siteConfig.name}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteConfig.name}`, description, images: [image] },
  };
}

export default async function ProjectCaseStudyPage({ params }: Props) {
  const project = findProject((await params).slug);
  if (!project) notFound();

  const softwareProject = isSoftwareProject(project);
  const currentIndex = projects.findIndex((entry) => entry.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const number = String(currentIndex + 1).padStart(2, "0");
  const total = String(projects.length).padStart(2, "0");
  const trail = [["Work", "/work"], [project.name, `/work/${project.slug}`]] as const;
  const visitLabel = `${projectVisitLabel(project)} — ${project.name} (opens in a new tab)`;

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
      breadcrumbSchema(trail),
    ],
  };

  return (
    <PageShell>
      <div className="shell">
        <Crumbs trail={trail} />
        <header className="page-hero page-hero--solo">
          <div className="page-hero-copy">
            <p className="label">Case study {number} / {total}</p>
            <h1>{project.name}</h1>
            <p className="lead">{project.description}</p>
            <div className="actions">
              <a className="button button-primary" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={visitLabel}>
                {projectVisitLabel(project)} <ArrowIcon />
              </a>
              <Link className="button button-ghost" href="/contact">Start a similar project <ArrowIcon direction="right" /></Link>
            </div>
          </div>
        </header>

        <dl className="meta-grid">
          <div><dt>Sector</dt><dd>{project.sector}</dd></div>
          <div><dt>Category</dt><dd>{formatCategory(project.category)}</dd></div>
          <div>
            <dt>{project.region ? "Region" : project.techStack.length ? "Stack" : "Focus"}</dt>
            <dd>{project.region ?? (project.techStack.length ? project.techStack.join(" · ") : project.tags[0])}</dd>
          </div>
          <div>
            <dt>{projectDestinationLabel(project)}</dt>
            <dd>
              <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.displayUrl} (opens in a new tab)`}>
                {project.displayUrl} <ArrowIcon />
              </a>
            </dd>
          </div>
        </dl>

        <div className="case-media">
          <ProjectFrame project={project} natural priority sizes="(max-width: 1320px) 94vw, 1320px" />
          <p className="muted" style={{ marginTop: "0.75rem", fontSize: "var(--type-small)" }}>
            {softwareProject ? "Public sign-in capture only. Internal records remain private." : `Desktop homepage capture · ${project.displayUrl}`}
          </p>
        </div>

        <section className="split section" style={{ paddingTop: 0 }} aria-label="Overview and approach">
          <div data-reveal>
            <p className="label">Overview</p>
            <p className="statement" style={{ marginTop: "1rem" }}>{project.overview}</p>
          </div>
          <div className="prose" data-reveal>
            <p className="label">Approach</p>
            <h2>{project.headline ?? `${project.tags[0]} for ${project.name}`}</h2>
            <p>{project.solution}</p>
          </div>
        </section>
      </div>

      <section className="section section--tint" aria-labelledby="features-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">Key features</p>
            <h2 id="features-heading">What was built.</h2>
            <div>
              <h3 className="label label--plain" style={{ marginBottom: "0.6rem" }}>Capabilities</h3>
              <ul className="chips">{project.tags.map((tag) => <li key={tag} className="chip">{tag}</li>)}</ul>
            </div>
            {project.techStack.length > 0 ? (
              <div>
                <h3 className="label label--plain" style={{ marginBottom: "0.6rem" }}>Project technology</h3>
                <ul className="chips">{project.techStack.map((tech) => <li key={tech} className="chip">{tech}</li>)}</ul>
              </div>
            ) : null}
          </div>
          <ol className="rows">
            {project.keyFeatures.map((feature, index) => (
              <li key={feature} data-reveal>
                <div className="row" style={{ gridTemplateColumns: "3.5rem minmax(0, 1fr)" }}>
                  <span className="row-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{feature}</h3>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {project.gallery ? (
        <section className="section" aria-labelledby="gallery-heading">
          <div className="shell">
            <p className="label">A closer look</p>
            <h2 id="gallery-heading" style={{ marginTop: "1rem" }}>{project.name}, on screen.</h2>
            <ul className="gallery" aria-label={`${project.name} website screens`}>
              {project.gallery.map((shot) => (
                <li key={shot.src} data-reveal>
                  <figure>
                    <div className="frame-media" style={{ aspectRatio: shot.aspectRatio ?? projectArtworkRatio(project) }}>
                      <Image src={shot.src} alt={shot.alt} fill loading="lazy" sizes="(max-width: 820px) 92vw, 420px" />
                    </div>
                    <figcaption>{shot.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section section--deep" aria-labelledby="live-heading">
        <div className="shell" style={{ display: "grid", gap: "1.25rem", justifyItems: "start" }} data-reveal>
          <DestinationChip project={project} />
          <h2 id="live-heading">See {project.name} for yourself.</h2>
          <p className="lead">
            {project.destination === "unavailable"
              ? "The public address for this project is not responding at the moment. The case study above records the work as delivered."
              : softwareProject
                ? "This is a protected business system. The link opens its public sign-in screen; staff records stay private."
                : project.destination === "hosted-showcase"
                  ? "This project is presented as a hosted showcase of the website."
                  : "The website is live. Open it in a new tab and try it on your own device."}
          </p>
          <a className="button button-primary" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={visitLabel}>
            {projectVisitLabel(project)} <ArrowIcon />
          </a>
        </div>
      </section>

      <div className="shell">
        <Link className="next-project" href={`/work/${nextProject.slug}`}>
          <span style={{ display: "grid", gap: "1rem" }}>
            <span className="label">Next project</span>
            <h2>{nextProject.name}</h2>
            <span className="work-cue">View case study <ArrowIcon /></span>
          </span>
          <ProjectFrame project={nextProject} sizes="(max-width: 820px) 92vw, 560px" />
        </Link>
      </div>
      <JsonLd data={schema} />
    </PageShell>
  );
}
