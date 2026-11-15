/**
 * The homepage chapters, in page order. Eyebrow numbers are derived from this
 * list so they stay sequential whenever a chapter is added, moved or removed.
 * `enquiry` is the contact form's own eyebrow, which closes the final chapter.
 */
export const homeSections = [
  { id: "about", label: "A different perspective" },
  { id: "work", label: "A living collection" },
  { id: "services", label: "The possibilities" },
  { id: "film", label: "A studio in motion" },
  { id: "process", label: "The process" },
  { id: "contact", label: "A new beginning" },
  { id: "enquiry", label: "Start a conversation" },
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
