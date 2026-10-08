import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CountUp } from "../../components/motion/CountUp";
import { PageTransition } from "../../components/motion/PageTransition";
import { ArrowIcon } from "../../icons";
import { ProjectArtwork, projectArtworkRatio } from "../../project-artwork";
import { formatCategory, isLiveProject, projectStatusLabel } from "../../project-data";
import { findService } from "../../services/service-data";
import { SiteHeader } from "../../site-chrome";
import { SiteFooter } from "../../site-footer";
import { siteConfig } from "../../site-config";
import { findIndustry, industries, industryProjects } from "../industry-data";
import "../industries.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const industry = findIndustry((await params).slug);
  if (!industry) return {};
  const lead = industryProjects(industry)[0];
  return {
    title: industry.title,
    description: industry.summary,
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: {
      title: `${industry.title} | ${siteConfig.name}`,
      description: industry.summary,
      url: `/industries/${industry.slug}`,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_AU",
      images: [{ url: `/work/${lead.slug}/opengraph-image`, width: 1200, height: 630, alt: `${industry.title} by ${siteConfig.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${industry.title} | ${siteConfig.name}`,
      description: industry.summary,
      images: [`/work/${lead.slug}/opengraph-image`],
    },
  };
}

export default async function IndustryPage({ params }: Props) {
  const industry = findIndustry((await params).slug);
  if (!industry) notFound();

  const work = industryProjects(industry);
  const index = industries.findIndex((item) => item.slug === industry.slug);
  const number = String(index + 1).padStart(2, "0");
  const lead = work[0];
  const services = industry.services.map((slug) => {
    const service = findService(slug);
    if (!service) throw new Error(`industries: unknown service slug "${slug}"`);
    return service;
  });
  const others = industries.filter((item) => item.slug !== industry.slug);
  const stack = Array.from(new Set(work.flatMap((project) => project.techStack)));
  const [titleLead, ...titleRest] = industry.title.split(" for ");

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: industry.title,
        description: industry.summary,
        url: `${siteConfig.url}/industries/${industry.slug}`,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        about: { "@type": "Thing", name: industry.name },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: work.map((project, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: project.name,
            url: `${siteConfig.url}/work/${project.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Industries", item: `${siteConfig.url}/industries` },
          { "@type": "ListItem", position: 3, name: industry.name, item: `${siteConfig.url}/industries/${industry.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <PageTransition>
        <main className="gr-ind-page gr-ind-detail" id="main-content">
          <section className="gr-ind-hero">
            <div className="container">
              <nav className="content-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/industries">Industries</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{industry.name}</span>
              </nav>
              <div className="gr-ind-hero-grid">
                <div>
                  <p className="eyebrow" data-reveal><span className="gr-kicker-num">{number}</span> / Industry</p>
                  <h1 className="gr-ind-title">
                    <span className="mask-line"><span>{titleLead} for{" "}</span></span>
                    <span className="mask-line"><span className="accent-serif">{titleRest.join(" for ")}.</span></span>
                  </h1>
                  <p className="content-lead" data-reveal>{industry.intro}</p>
                  <div className="content-actions" data-reveal>
                    <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
                    <a className="button button-ghost" href="#industry-work" data-magnetic>See the Work <ArrowIcon direction="down-right" /></a>
                  </div>
                </div>
                <dl className="gr-ind-figures" data-reveal>
                  <div><dt>Projects in this industry</dt><dd><CountUp value={work.length} /></dd></div>
                </dl>
              </div>
            </div>
          </section>

          <div className="gr-ind-lead">
            <div className="container">
              <Link className="gr-ind-lead-frame gr-cut-lg" href={`/work/${lead.slug}`} aria-label={`${lead.name} — View Case Study`} data-cursor="VIEW">
                <span className="gr-ind-lead-image" style={{ aspectRatio: projectArtworkRatio(lead) }}>
                  <ProjectArtwork project={lead} priority sizes="(max-width: 1040px) 100vw, 1376px" />
                </span>
                <span className="live-label"><i /> {projectStatusLabel(lead)}</span>
              </Link>
            </div>
          </div>

          <section className="gr-ind-focus" aria-labelledby="industry-focus-heading">
            <div className="container gr-ind-focus-grid">
              <div data-reveal>
                <p className="eyebrow">What matters</p>
                <h2 id="industry-focus-heading">{industry.focusTitle}</h2>
              </div>
              <ol className="gr-ind-focus-list">
                {industry.focus.map(([title, copy], i) => (
                  <li key={title} data-reveal>
                    <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="gr-ind-work" id="industry-work" aria-labelledby="industry-work-heading">
            <div className="container">
              <div className="gr-ind-work-head" data-reveal>
                <p className="eyebrow">The work</p>
                <h2 id="industry-work-heading">{industry.name}, <span className="accent-serif">built and live.</span></h2>
              </div>
              {work.map((project, i) => {
                const live = isLiveProject(project);
                return (
                  <article className={`gr-ind-project${i % 2 ? " gr-ind-project--flip" : ""}`} key={project.slug} data-reveal>
                    <div className="gr-ind-project-media">
                      <Link className="gr-ind-project-desktop gr-cut-lg" href={`/work/${project.slug}`} tabIndex={-1} aria-hidden="true">
                        <span style={{ aspectRatio: projectArtworkRatio(project) }}>
                          <ProjectArtwork project={project} sizes="(max-width: 960px) 92vw, 54vw" />
                        </span>
                      </Link>
                      {project.mobileImage && (
                        <span className="gr-ind-project-phone" aria-hidden="true">
                          <Image src={project.mobileImage} alt="" width={780} height={1688} loading="lazy" sizes="(max-width: 960px) 34vw, 180px" />
                        </span>
                      )}
                    </div>
                    <div className="gr-ind-project-copy">
                      <p className="gr-kicker"><span className="gr-kicker-num">{String(i + 1).padStart(2, "0")}</span> / {formatCategory(project.category)}</p>
                      <h3>{project.name}</h3>
                      <p className="gr-ind-project-desc">{project.overview}</p>
                      <ul className="gr-ind-project-features">
                        {project.keyFeatures.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                      <p className="gr-ind-project-stack">{project.techStack.join(" · ")}</p>
                      <div className="gr-ind-project-links">
                        <Link className="text-link" href={`/work/${project.slug}`}>Read the case study <ArrowIcon /></Link>
                        {live && (
                          <a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">
                            Visit the live site <ArrowIcon direction="up-right" /><span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="gr-ind-services" aria-labelledby="industry-services-heading">
            <div className="container gr-ind-services-grid">
              <div data-reveal>
                <p className="eyebrow">How we help</p>
                <h2 id="industry-services-heading">The services behind the work.</h2>
                <p className="gr-ind-stack">Built with {stack.join(", ")}.</p>
              </div>
              <ul className="gr-ind-service-links">
                {services.map((service) => (
                  <li key={service.slug} data-reveal>
                    <Link href={`/services/${service.slug}`}>
                      <span>{service.title}</span>
                      <small>{service.summary}</small>
                      <ArrowIcon />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <nav className="gr-ind-others" aria-label="Other industries">
            <div className="container">
              <p className="eyebrow">Other industries</p>
              <ul>
                {others.map((item) => (
                  <li key={item.slug}><Link href={`/industries/${item.slug}`}>{item.name} <ArrowIcon /></Link></li>
                ))}
              </ul>
            </div>
          </nav>

          <aside className="gr-final-cta" aria-labelledby="industry-cta-heading">
            <div className="container gr-final-cta-inner" data-reveal>
              <p className="eyebrow">Next</p>
              <h2 id="industry-cta-heading">Your business could be the next one <span className="accent-serif">on this page.</span></h2>
              <p className="content-lead">Tell us what you are building and where you want the business to go. We will come back with a practical next step.</p>
              <div className="content-actions">
                <Link className="button button-primary" href="/contact" data-magnetic>Start a Project <ArrowIcon /></Link>
                <a className="button button-ghost" href={`tel:${siteConfig.phoneInternational}`}>Call {siteConfig.phoneDisplay}</a>
              </div>
            </div>
          </aside>

          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
        </main>
      </PageTransition>
      <SiteFooter currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
