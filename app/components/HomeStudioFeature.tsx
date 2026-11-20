import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../icons";
import { Reveal } from "./motion/Reveal";
import "./HomeStudioFeature.css";

// Mirrors `areaLabels` in app/studio/studio-state.ts. Kept local so the homepage never imports studio code;
// tests/home-studio-feature.test.mjs fails if the two lists drift apart.
const rooms = ["Reception", "Portfolio gallery", "Services atelier", "Consultation lounge"] as const;

/** Server-rendered homepage entry to /studio: a still, never the 3D scene. */
export function HomeStudioFeature() {
  return (
    <section className="home-studio" id="virtual-studio" aria-labelledby="home-studio-heading">
      <div className="cinema-shell home-studio-grid">
        <div className="home-studio-copy">
          <p className="cinema-label">The Virtual Studio</p>
          <Reveal as="h2" id="home-studio-heading">A different <em>perspective.</em></Reveal>
          <p className="home-studio-lede">A place for ideas to take shape. Four spaces. One considered approach.</p>
          <ol className="home-studio-rooms" aria-label="The four spaces of the virtual studio">
            {rooms.map((room, index) => (
              <li key={room}><span className="cinema-label">{String(index + 1).padStart(2, "0")}</span>{room}</li>
            ))}
          </ol>
          <p className="home-studio-locals">Meet the locals: a kangaroo, a koala and a cockatoo.</p>
          <div className="home-studio-actions">
            <Link className="ruby-project-cta" href="/studio" prefetch={false}><span>Enter the Virtual Studio</span><ArrowIcon /></Link>
            <Link className="cinema-link" href="/studio#studio-content" prefetch={false}>Explore the studio without 3D <ArrowIcon /></Link>
          </div>
        </div>
        <figure className="home-studio-art" data-tilt>
          {/* The visible CTA carries the action; this wrapper only widens the click target for pointer users. */}
          <Link href="/studio" prefetch={false} tabIndex={-1} aria-hidden="true">
            <Image
              src="/studio/studio-home-still.jpg"
              width={1440}
              height={900}
              sizes="(max-width: 960px) calc(100vw - 40px), 640px"
              loading="lazy"
              alt="A view into the AB Web Studio virtual studio: the reception monogram, project gallery screens and ruby consultation lounge behind a glass and brass facade"
            />
          </Link>
        </figure>
      </div>
    </section>
  );
}
