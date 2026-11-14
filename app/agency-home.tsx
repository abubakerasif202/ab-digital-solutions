import Link from "next/link";
import { ContactForm } from "./components/ContactForm";
import { HeroStage } from "./components/hero/HeroStage";
import { CtaBand, DestinationChip, EnquiryAside, FaqList, PageShell, ProcessRail, SectionHead, WorkItem } from "./components/ui";
import { ArrowIcon } from "./icons";
import { ProjectArtwork } from "./project-artwork";
import { findProject, projects, sectors, type Project } from "./project-data";
import { findService, servicePages } from "./services/service-data";
import { siteConfig } from "./site-config";

const project = (slug: string): Project => {
  const match = findProject(slug);
  if (!match) throw new Error(`agency-home: unknown project "${slug}"`);
  return match;
};
const service = (slug: string) => {
  const match = findService(slug);
  if (!match) throw new Error(`agency-home: unknown service "${slug}"`);
  return match;
};

// Selected work: one lead, an offset pair, then a short index. Every entry is a registry project.
const leadProject = project("on-call-trailers");
const pairProjects = [project("247-inventory-system"), project("adelaide-wholesale-tyres")];
const indexProjects = ["jufaja-homes", "milestone-renovate", "aftab-sons-transport", "wild-pest-solutions"].map(project);
const stageProjects = [leadProject, ...pairProjects, ...indexProjects].map(({ slug, name, sector }) => ({ slug, name, sector }));

// Technology counts come from the registry, never from hand-typed numbers.
const stack = Object.entries(
  projects.reduce<Record<string, Project[]>>((groups, entry) => {
    for (const tech of entry.techStack) (groups[tech] ??= []).push(entry);
    return groups;
  }, {}),
)
  .sort(([, a], [, b]) => b.length - a.length)
  .slice(0, 6);
const codeBuilt = projects.filter((entry) => entry.techStack.some((tech) => tech === "Next.js" || tech === "React")).length;

const webDesign = service("web-design-sydney");
const seo = service("seo-local-visibility");
const faqs = [webDesign.faqs[1], webDesign.faqs[2], webDesign.faqs[0], webDesign.faqs[3], seo.faqs[3]];

export default function AgencyHome() {
  return (
    <PageShell>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="label">Sydney web studio · Working Australia-wide</p>
            <h1 id="hero-heading">Sharp websites and <em>working software</em> for Australian business.</h1>
            <p className="lead">
              AB Web Studio designs, builds and looks after websites, online stores and custom business systems, with local search and practical automation where they help.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/contact">Start a project <ArrowIcon /></Link>
              <Link className="button button-ghost" href="/work">See the work <ArrowIcon direction="right" /></Link>
            </div>
            <p className="hero-proof">
              <Link href="/work">{projects.length} project case studies <ArrowIcon /></Link>
              <a href={`tel:${siteConfig.phoneInternational}`}>Prefer to talk? {siteConfig.phoneDisplay}</a>
            </p>
          </div>
          <HeroStage projects={stageProjects} />
        </div>
        <dl className="shell ledger">
          <div><dt>Project case studies</dt><dd data-count={projects.length}>{projects.length}</dd></div>
          <div><dt>Industries</dt><dd data-count={sectors.length}>{sectors.length}</dd></div>
          <div><dt>Service areas</dt><dd data-count={servicePages.length}>{servicePages.length}</dd></div>
          <div><dt>Based in</dt><dd>Sydney</dd></div>
        </dl>
      </section>

      <section className="section" id="work" aria-labelledby="work-heading">
        <div className="shell">
          <SectionHead id="work-heading" label="Selected work" title="Real projects, labelled for what they are.">
            Every project opens as a case study first, and says whether it is a live website, a hosted showcase or a staff-access system.
          </SectionHead>

          <Link className="work-item work-lead" href={`/work/${leadProject.slug}`} data-reveal>
            <span className="frame">
              <span className="frame-bar" aria-hidden="true"><i /><i /><i /><span>{leadProject.displayUrl}</span></span>
              <span className="frame-media"><ProjectArtwork project={leadProject} sizes="(max-width: 820px) 92vw, 760px" /></span>
            </span>
            <span className="work-lead-copy">
              <span className="work-meta"><span>{leadProject.sector}</span><DestinationChip project={leadProject} /></span>
              <h3>{leadProject.name}</h3>
              <p>{leadProject.description}</p>
              <span className="work-cue">View case study <ArrowIcon /></span>
            </span>
          </Link>

          <div className="work-pair">
            {pairProjects.map((entry) => (
              <div key={entry.slug} data-reveal>
                <WorkItem project={entry} sizes="(max-width: 820px) 92vw, 600px" />
              </div>
            ))}
          </div>

          <ol className="rows work-index">
            {indexProjects.map((entry, index) => (
              <li key={entry.slug} data-reveal>
                <Link className="row" href={`/work/${entry.slug}`}>
                  <span className="row-num">{String(index + 4).padStart(2, "0")}</span>
                  <h3>{entry.name}</h3>
                  <span className="muted">{entry.sector}</span>
                  <DestinationChip project={entry} />
                  <span className="row-arrow"><ArrowIcon /></span>
                </Link>
              </li>
            ))}
          </ol>
          <p style={{ marginTop: "2rem" }}><Link className="text-link" href="/work">All {projects.length} projects <ArrowIcon /></Link></p>
        </div>
      </section>

      <hr className="vivid-rule" />

      <section className="section section--tint" id="services" aria-labelledby="services-heading">
        <div className="shell">
          <SectionHead id="services-heading" label="Services" title="From first impression to everyday operation.">
            Each service is explained by what it changes for the business: more of the right enquiries, less manual work, a site that stays healthy.
          </SectionHead>
          <ol className="rows">
            {servicePages.map((entry, index) => (
              <li key={entry.slug} data-reveal>
                <Link className="row service-row" href={`/services/${entry.slug}`}>
                  <span className="row-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <span className="row-arrow"><ArrowIcon /></span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="callout" data-reveal>
            <div>
              <h3>AI assistants and business automation</h3>
              <p>Have a task your team repeats every day? We look at where an assistant or a connected workflow could take it off their hands, and scope it alongside your website or system.</p>
            </div>
            <Link className="button button-ghost" href="/contact?service=custom-software">Discuss an automation idea <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="stack-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">Development capability</p>
            <h2 id="stack-heading">The tools behind the work.</h2>
            <p className="muted">Counted straight from the project registry, so the numbers move only when the work does.</p>
            <Link className="text-link" href="/services/custom-software-business-systems">Custom software and business systems <ArrowIcon /></Link>
          </div>
          <table className="sheet" data-reveal>
            <caption className="sr-only">Technologies used across {projects.length} projects, with an example case study for each</caption>
            <thead><tr><th scope="col">Technology</th><th scope="col">Projects</th><th scope="col">Example</th></tr></thead>
            <tbody>
              {stack.map(([tech, used]) => (
                <tr key={tech}>
                  <th scope="row">{tech}<span className="sheet-bar" style={{ width: `${Math.round((used.length / projects.length) * 100)}%` }} aria-hidden="true" /></th>
                  <td className="num">{used.length} of {projects.length}</td>
                  <td><Link href={`/work/${used[0].slug}`}>{used[0].name}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--deep" id="process" aria-labelledby="process-heading">
        <div className="shell">
          <SectionHead id="process-heading" label="How a project runs" title="A clear path from brief to launch.">
            No black box. Collaborative decisions, visible progress and review points you can plan around.
          </SectionHead>
          <ProcessRail />
        </div>
      </section>

      <section className="section" aria-labelledby="reasons-heading">
        <div className="shell">
          <SectionHead id="reasons-heading" label="Why AB" title="Reasons you can check." />
          <ul className="reasons">
            <li data-reveal>
              <h3>The work is open to inspection.</h3>
              <p>{projects.length} case studies show the brief, the approach and the result, each labelled as a live website, hosted showcase or staff-access system.</p>
              <p className="evidence">Evidence · <Link href="/work">the full project list</Link></p>
            </li>
            <li data-reveal>
              <h3>You deal with the person building it.</h3>
              <p>Founder and lead developer Abubakar Asif runs each project from first conversation to launch, so decisions are not lost between hand-offs.</p>
              <p className="evidence">Evidence · <Link href="/about">about the studio</Link></p>
            </li>
            <li data-reveal>
              <h3>A written, fixed-price proposal first.</h3>
              <p>Deliverables, responsibilities and costs are agreed in writing before any work begins.</p>
              <p className="evidence">Evidence · <Link href="/services/web-design-sydney">web design questions</Link></p>
            </li>
            <li data-reveal>
              <h3>Built in code, not page-builder templates.</h3>
              <p>Sites are engineered in React, Next.js and TypeScript, which leaves room for calculators, portals and dashboards when the business needs them.</p>
              <p className="evidence">Evidence · {codeBuilt} of {projects.length} projects use React or Next.js</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="faq-heading">
        <div className="shell split">
          <div className="split-sticky" data-reveal>
            <p className="label">Useful details</p>
            <h2 id="faq-heading">Questions people ask first.</h2>
            <p className="muted">More detail sits on each service page.</p>
            <Link className="text-link" href="/services">Explore the services <ArrowIcon /></Link>
          </div>
          <FaqList items={faqs} />
        </div>
      </section>

      <section className="section" id="contact" aria-labelledby="contact-heading">
        <div className="shell enquiry">
          <EnquiryAside id="contact-heading" />
          <ContactForm />
        </div>
      </section>

      <CtaBand id="closing-heading" label="Ready when you are" title="Bring the idea. We will bring a practical next step." />
    </PageShell>
  );
}
