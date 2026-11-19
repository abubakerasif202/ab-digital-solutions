import { sectionEyebrow } from "../home-sections";
import { serviceDelivery } from "../services/service-data";
import { Reveal } from "./motion/Reveal";

const steps = serviceDelivery["web-design-sydney"].steps;
/** What the client receives at the end of each step, in plain words. */
const deliverables = [
  "A one-page brief covering your goals, audience and what the site must do.",
  "A sitemap, page plan and visual direction for the key pages.",
  "A responsive build, reviewed on phones, tablets and desktops.",
  "Launch with an accessibility and performance check, then a handover.",
] as const;

export function ProcessSection() {
  return (
    <section className="ruby-process" id="process" aria-labelledby="process-heading">
      <div className="cinema-shell">
        <header className="ruby-section-header">
          <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("process")}</Reveal>
          <Reveal as="h2" id="process-heading">How a project runs.</Reveal>
        </header>
        <ol className="ruby-process-steps">
          {steps.map(([name, description], index) => {
            const deliverable = deliverables[index];
            return (
              <li key={name} className="ruby-process-step">
                <div className="ruby-process-marker">
                  <span className="ruby-process-number cinema-label">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                </div>
                <div className="ruby-process-detail">
                  <p>{description}</p>
                  {deliverable && (
                    <p className="ruby-process-deliverable"><span className="cinema-label">You receive</span>{deliverable}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
