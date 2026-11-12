import type { CSSProperties } from "react";
import { ArrowIcon } from "../../../icons";

type ProcessStep = readonly [number: string, title: string, description: string];

/**
 * The process on a paper band: four steps hung from a measured rail, each
 * dropped a little lower than the last so the sequence reads as a descent
 * rather than a row. Pure CSS; the scroll-driven reveal is an enhancement.
 */
export function ProcessBand({ steps }: { steps: readonly ProcessStep[] }) {
  return (
    <section className="sx-process" id="process" aria-labelledby="process-heading">
      <div className="sx-process-inner">
        <div className="sx-process-head">
          <p className="ix-label">03 · How we work</p>
          <h2 id="process-heading">A clear path from ambition to <em>launch.</em></h2>
          <p>No black box. No unnecessary technical fog. Just collaborative decisions, visible progress and a dependable finish.</p>
          <a className="ix-btn sx-btn-ink" href="#contact">Start Your Project <ArrowIcon /></a>
        </div>

        <ol className="sx-steps">
          {steps.map(([number, title, description], index) => (
            <li key={number} style={{ "--i": index } as CSSProperties}>
              <span className="sx-step-no">{number}</span>
              <div className="sx-step-body">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
