import Link from "next/link";
import { ArrowIcon } from "../icons";
import { projects } from "../project-data";
import { Reveal } from "./motion/Reveal";
import { ProjectExhibition } from "./cinematic/ProjectExhibition";

export function PortfolioSection() {
  return (
    <section className="cinema-work exhibition-section" id="work" aria-labelledby="work-heading">
      <div className="cinema-shell">
        <header className="cinema-section-head exhibition-section-head">
          <Reveal as="p" className="cinema-label">01 / A living collection</Reveal>
          <Reveal as="h2" id="work-heading">The work.<br /><em>Never standing still.</em></Reveal>
          <div><p>Real businesses. Distinctive digital experiences. An evolving exhibition of our websites and custom software.</p><Link className="cinema-link" href="/work">Explore all {projects.length} projects <ArrowIcon /></Link></div>
        </header>
        <ProjectExhibition />
      </div>
    </section>
  );
}
