import { sectionEyebrow } from "../home-sections";
import { serviceDelivery } from "../services/service-data";
import { Reveal } from "./motion/Reveal";

const steps = serviceDelivery["web-design-sydney"].steps;
const sketches = [
  ["Project brief", "Goals", "Audience", "Priorities"],
  ["Interface study", "Structure", "Typography", "Interaction"],
  ["Build checklist", "Components", "Content", "Integrations"],
  ["Release checklist", "Accessibility", "Performance", "Handover"],
] as const;

export function ProcessSection() {
  return (
    <section className="ruby-process" id="process" aria-labelledby="process-heading">
      <div className="cinema-shell">
        <header className="ruby-section-header">
          <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("process")}</Reveal>
          <Reveal as="h2" id="process-heading">The thinking behind the feeling.</Reveal>
        </header>
        <ol className="ruby-process-steps">
          {steps.map(([name, description], index) => {
            const sketch = sketches[index];
            return (
              <li key={name} className="ruby-process-step">
                <div className="ruby-process-marker">
                  <span className="ruby-process-number cinema-label">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                </div>
                <div className="ruby-process-detail">
                  <p>{description}</p>
                  {sketch && (
                    <div className="ruby-process-sketch" aria-hidden="true" data-sketch={index}>
                      <span>{sketch[0]}</span>
                      <ul>{sketch.slice(1).map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
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
