import Link from "next/link";
import { ArrowIcon } from "../icons";
import { projects } from "../project-data";
import { ProjectExhibition } from "./cinematic/ProjectExhibition";

export function PortfolioSection() {
  return (
    <section className="cinema-work exhibition-section" id="work" aria-labelledby="work-heading">
      <div className="cinema-shell">
        <header className="cinema-section-head exhibition-section-head">
          <h2 id="work-heading">The work.</h2>
          <div><p>Websites, online stores and custom software for real businesses.</p><Link className="cinema-link" href="/work" prefetch={false}>Explore all {projects.length} projects <ArrowIcon /></Link></div>
        </header>
        <ProjectExhibition />
      </div>
    </section>
  );
}
