import { siteConfig } from "../../site-config";
import { BrandFilmPlayer, type FilmChapter } from "./BrandFilmPlayer";
import { Reveal } from "../motion/Reveal";

const chapters: readonly FilmChapter[] = [
  { label: "Perspective", start: 0, description: "Real Sydney skyline timelapse with an editorial opening title." },
  { label: "Presence", start: 4, description: "The Sydney Opera House and Harbour Bridge at night, filmed by Daniel Shepherd." },
  { label: "The work", start: 8, description: "Actual project screenshots: Jufaja, Milestone Renovate, Aftab & Sons and the 247 Inventory System." },
  { label: "The studio", start: 20, description: "The AB Web Studio identity over real Sydney harbour footage. Design with intent. Develop with purpose." },
];

const FILM = {
  title: "AB Web Studio — A different perspective",
  duration: 24,
  poster: "/film/ab-studio-ruby-v2-poster.webp",
  sources: { desktop: "/film/ab-studio-ruby-v2-1080.mp4", mobile: "/film/ab-studio-ruby-v2-720.mp4" },
} as const;

const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: FILM.title,
  description: "A 24-second original studio edit combining licensed Sydney footage, actual project screenshots and ruby-accented editorial typography. Silent, with no spoken content.",
  thumbnailUrl: `${siteConfig.url}${FILM.poster}`,
  contentUrl: `${siteConfig.url}${FILM.sources.desktop}`,
  uploadDate: "2026-11-15",
  duration: "PT24S",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

export function BrandFilmSection() {
  return (
    <section className="ruby-film" id="film" aria-labelledby="film-heading">
      <div className="cinema-shell">
        <header className="ruby-section-header">
          <Reveal as="p" className="cinema-label ruby-eyebrow">04 / A studio in motion</Reveal>
          <Reveal as="h2" id="film-heading">Sydney, in motion.<br /><em>Ideas, made real.</em></Reveal>
          <p>A different perspective. Twenty-four seconds of real Sydney, genuine project work and the thinking that brings them together.</p>
        </header>
        <Reveal className="ruby-film-stage" variant="mask">
          <BrandFilmPlayer title={FILM.title} poster={FILM.poster} sources={FILM.sources} chapters={chapters} duration={FILM.duration} />
        </Reveal>
        <div className="ruby-film-credit"><span>Original studio edit / Licensed Sydney footage / Actual project visuals / Silent film</span><a href="https://www.pexels.com/video/the-sydney-opera-house-and-harbour-bridge-26580902/" target="_blank" rel="noopener noreferrer">Footage via Pexels <span className="sr-only">(opens in a new tab)</span></a></div>
        <div id="process" className="ruby-delivery">
          <p className="cinema-label">The thinking behind the feeling</p>
          <ol><li><span>01</span> Discover</li><li><span>02</span> Design</li><li><span>03</span> Build</li><li><span>04</span> Launch</li></ol>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }} />
    </section>
  );
}
