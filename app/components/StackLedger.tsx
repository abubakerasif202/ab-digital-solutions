import Link from "next/link";
import { ArrowIcon } from "../icons";
import { projectDestinationLabel, projects } from "../project-data";

// Each ledger row groups the registry's techStack labels that name the same
// tool, so the counts always come from the canonical project data.
const ledger = [
  { name: "TypeScript", role: "Language", matches: ["TypeScript"] },
  { name: "Tailwind CSS", role: "Styling", matches: ["Tailwind CSS"] },
  { name: "Next.js", role: "Framework", matches: ["Next.js"] },
  { name: "React", role: "Interface", matches: ["React"] },
  { name: "Vite", role: "Build tooling", matches: ["Vite"] },
  { name: "Framer Motion", role: "Motion", matches: ["Framer Motion"] },
  { name: "JSON-LD", role: "Structured data", matches: ["JSON-LD"] },
  { name: "Supabase + PostgreSQL", role: "Data & auth", matches: ["Supabase", "PostgreSQL"] },
] as const;

const rows = ledger
  .map(({ name, role, matches }) => ({
    name,
    role,
    count: projects.filter((project) => project.techStack.some((tech) => (matches as readonly string[]).includes(tech))).length,
  }))
  .filter((row) => row.count > 0)
  .sort((a, b) => b.count - a.count);

const standards = [
  "Responsive, mobile-first layouts",
  "Reduced-motion-aware animation",
  "Search-ready structure and JSON-LD",
  "Accessibility-conscious markup",
  "Clear enquiry and quote pathways",
] as const;

export function StackLedger() {
  const total = projects.length;
  const lead = projects[0];

  return (
    <section className="section stack-section" id="stack" aria-labelledby="stack-heading">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow section-index"><span className="section-index-num">04</span><span className="micro-rule" aria-hidden="true" />The stack</p>
            <h2 id="stack-heading">Engineered, not <span className="accent-serif">assembled.</span></h2>
          </div>
          <p>Modern, proven tooling, chosen per project rather than by habit. This is what shipped across the {total} projects in the portfolio.</p>
        </div>

        <div className="stack-layout">
          <div className="stack-table-wrap" data-reveal>
            <table className="stack-table">
              <caption>Portfolio stack ledger <span aria-hidden="true">/</span> projects using each technology</caption>
              <thead>
                <tr><th scope="col">Technology</th><th scope="col">Role</th><th scope="col">Projects</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td>{row.role}</td>
                    <td>
                      <span className="stack-meter">
                        <span className="stack-meter-track" aria-hidden="true">
                          <span style={{ width: `${(row.count / total) * 100}%` }} />
                        </span>
                        <span className="stack-meter-value">{row.count} of {total}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="stack-aside" aria-label="Build sheet and standards" data-reveal>
            <h3>Build sheet</h3>
            <dl className="build-sheet">
              <div><dt>Project</dt><dd>{lead.name}</dd></div>
              <div><dt>Stack</dt><dd>{lead.techStack.join(" / ")}</dd></div>
              <div><dt>Scope</dt><dd>{lead.tags.slice(0, 3).join(" / ")}</dd></div>
              <div><dt>Status</dt><dd>{projectDestinationLabel(lead)}</dd></div>
            </dl>
            <Link className="text-link" href={`/work/${lead.slug}`}>Read the case study <ArrowIcon /></Link>
            <h3>Shipped as standard</h3>
            <ul className="stack-standards">
              {standards.map((standard) => <li key={standard}>{standard}</li>)}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
