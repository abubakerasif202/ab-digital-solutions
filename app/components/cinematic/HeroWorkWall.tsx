import type { CSSProperties } from "react";
import { projects, type Project } from "../../project-data";
import { ProjectArtwork } from "../../project-artwork";
import { TickerToggle } from "./TickerToggle";
import { wallColumns } from "./work-wall-layout";

/**
 * The hero backdrop: real homepage captures from every case study, drifting in
 * slow columns. Purely decorative (the proof row below links to the work), so the
 * whole track is hidden from assistive technology and holds no focusable elements.
 * Motion only starts once the pause control is interactive (WCAG 2.2.2).
 */
export function HeroWorkWall() {
  const columns = wallColumns<Project>(projects);
  return (
    <>
    {/* The control is a direct child of the hero so it sits above the hero shade. */}
    <TickerToggle className="work-wall-control" label="Pause project wall" controls="work-wall-track" />
    <div className="work-wall">
      <div id="work-wall-track" className="work-wall-track" aria-hidden="true">
        {columns.map((column, columnIndex) => (
          <ul className="work-wall-column" role="list" key={columnIndex} style={{ "--column": columnIndex } as CSSProperties}>
            {[0, 1].flatMap(copy => column.map((project, index) => (
              <li className="work-wall-tile" key={`${copy}-${project.slug}`}>
                <div className="work-wall-frame">
                  <ProjectArtwork project={project} sizes="(max-width: 900px) 46vw, 22vw" decorative priority={copy === 0 && index === 0 && columnIndex < 2} />
                </div>
                <span>{project.titleName ?? project.name}</span>
              </li>
            )))}
          </ul>
        ))}
      </div>
    </div>
    </>
  );
}
