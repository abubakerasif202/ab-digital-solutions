import { sectionEyebrow, type HomeSectionId } from "../home-sections";

export function SectionEyebrow({ section }: { section: HomeSectionId }) {
  return <p className="cinema-label ruby-eyebrow">{sectionEyebrow(section)}</p>;
}