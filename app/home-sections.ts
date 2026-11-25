/**
 * The homepage chapters, in page order. Eyebrow numbers are derived from this
 * list so they stay sequential whenever a chapter is added, moved or removed.
 * Only the five main homepage sections are numbered.
 */
export const homeSections = [
  { id: "work", label: "Work" },
  { id: "services", label: "Services" },
  { id: "process", label: "The process" },
  { id: "virtual-studio", label: "The Virtual Studio" },
  { id: "contact", label: "Contact" },
] as const;

export type HomeSectionId = (typeof homeSections)[number]["id"];

/** Two-digit chapter number for a homepage section, e.g. "03". */
export function sectionNumber(id: HomeSectionId): string {
  const index = homeSections.findIndex((section) => section.id === id);
  return String(index + 1).padStart(2, "0");
}

/** Eyebrow text for a homepage section, e.g. "03 / The possibilities". */
export function sectionEyebrow(id: HomeSectionId): string {
  const section = homeSections.find((entry) => entry.id === id);
  return `${sectionNumber(id)} / ${section?.label ?? ""}`;
}
