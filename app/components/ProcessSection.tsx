import { sectionEyebrow } from "../home-sections";
import { serviceDelivery } from "../services/service-data";
import { Reveal } from "./motion/Reveal";

/**
 * The studio's working process. The four steps are the same ones the service
 * pages publish under "From first conversation to a dependable result", read
 * from the same data so the two never drift apart.
 */
const steps = serviceDelivery["web-design-sydney"].steps;

export function ProcessSection() {
  return (
    <section className="ruby-process" id="process" aria-labelledby="process-heading">
      <div className="cinema-shell">
        <header className="ruby-section-header">
          <Reveal as="p" className="cinema-label ruby-eyebrow">{sectionEyebrow("process")}</Reveal>
          <Reveal as="h2" id="process-heading">The thinking behind the feeling.</Reveal>
        </header>
        <ol className="ruby-process-steps">
          {steps.map(([name, description], index) => (
            <li key={name}>
              <Reveal variant="line">
                <span className="ruby-process-number cinema-label">{String(index + 1).padStart(2, "0")}</span>
                <h3>{name}</h3>
                <p>{description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
