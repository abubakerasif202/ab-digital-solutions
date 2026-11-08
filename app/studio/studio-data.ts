import { projectDestinationLabel, projects, type Project } from "../project-data";
import { servicePages } from "../services/service-data";
import { contactServiceKeys, contactServices } from "../contact-options";

export const studioProjects = projects.map((project: Project) => ({
  slug: project.slug, name: project.name, sector: project.sector, description: project.description, image: project.image, alt: project.alt,
  destination: project.destination ?? "public",
  // Public websites, hosted showcases and staff-access systems keep the labels the case studies use.
  destinationLabel: projectDestinationLabel(project),
}));
export type StudioProject = (typeof studioProjects)[number];
export type ContactService = (typeof contactServices)[number];
export type StudioService = {
  title: string;
  description: string;
  href: string;
  cta: string;
  benefits: string[];
  /** Matches an option in the contact form so an enquiry can start with this service selected. */
  contactService: ContactService;
};

export const studioServices: StudioService[] = servicePages.map((service) => ({
  title: service.title,
  description: service.summary,
  href: `/services/${service.slug}`,
  cta: "Explore this service",
  benefits: [...service.benefits],
  // Each service page names the contact-form option that describes the same work.
  contactService: contactServiceKeys[service.contactKey],
}));
/** Services shown on the four 3D pedestals, by index into studioServices. */
export const featuredServiceIndexes = [0, 1, 2, studioServices.length - 1] as const;

/** Mirrors the homepage process so the Studio and the site describe delivery the same way. */
export const studioProcess = [
  ["Discover", "We clarify your audience, offer, goals and the actions your website needs to drive."],
  ["Design", "We map the content, page structure and customer journey before visual design begins."],
  ["Build", "We create, refine and develop the experience responsively, with clear review points."],
  ["Launch", "We complete launch checks, publish with confidence and stay available as you grow."],
] as const;

export function contactHref(service?: ContactService) {
  return service ? `/contact?service=${encodeURIComponent(service)}` : "/contact";
}
