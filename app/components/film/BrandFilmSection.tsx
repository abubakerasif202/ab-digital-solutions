import { siteConfig } from "../../site-config";
import { BrandFilmPlayer, type FilmChapter } from "./BrandFilmPlayer";
import { LogoReveal } from "./LogoReveal";

/* Scene timings mirror the supplied Claude Design film (35s, 5 scenes). */
const chapters: readonly FilmChapter[] = [
  { label: "Reveal", start: 0, description: "Particles emerge from darkness and assemble into the AB monogram." },
  { label: "Into", start: 5, description: "The camera dives through the logo into a digital space of glass interfaces." },
  { label: "Showcase", start: 10, description: "Desktop, tablet and phone interfaces orbit as the four services play in turn." },
  { label: "Portfolio", start: 18, description: "A 3D gallery of client websites glides past with project names." },
  { label: "Finale", start: 25, description: "The gallery re-forms into the logo, then taglines and address." },
];

const FILM = {
  title: "AB Web Studio brand film",
  duration: 35,
  poster: "/film/ab-film-poster.webp",
  sources: { desktop: "/film/ab-web-studio-film-1080.mp4", mobile: "/film/ab-web-studio-film-720.mp4" },
} as const;

const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: FILM.title,
  description: "A 35-second film introducing AB Web Studio: the logo reveal, services and selected client websites.",
  thumbnailUrl: `${siteConfig.url}${FILM.poster}`,
  contentUrl: `${siteConfig.url}${FILM.sources.desktop}`,
  uploadDate: "2026-10-23",
  duration: "PT35S",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

export function BrandFilmSection() {
  return (
    <section className="section brand-film-section" id="film" aria-labelledby="film-heading">
      <div className="container">
        <header className="brand-film-head" data-reveal>
          <p className="eyebrow">The studio in motion</p>
          <h2 id="film-heading" className="gr-display-xl">Thirty-five seconds <span className="accent-serif">of craft.</span></h2>
        </header>
        <div className="brand-film-grid">
          <div className="brand-film-logo" data-reveal>
            <LogoReveal />
          </div>
          <div className="brand-film-video" data-reveal>
            <BrandFilmPlayer
              title={FILM.title}
              poster={FILM.poster}
              sources={FILM.sources}
              chapters={chapters}
              duration={FILM.duration}
            />
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
