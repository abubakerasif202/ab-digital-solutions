import { projects, type Project } from "../project-data";
import { servicePages } from "../services/service-data";

export const studioProjects = projects.map(({ slug, name, sector, description, image, alt, destination }: Project) => ({
  slug, name, sector, description, image, alt, destination: destination ?? "public",
}));
export type StudioProject = (typeof studioProjects)[number];
export type StudioService = { title: string; description: string; href: string; benefits: string[] };
export const studioServices: StudioService[] = ["web-design-sydney", "seo-local-visibility", "branding-content"].map((slug) => {
  const service = servicePages.find((entry) => entry.slug === slug)!;
  return { title: service.title, description: service.detail, href: `/services/${service.slug}`, benefits: [...service.benefits] };
});
studioServices.push({
  title: "AI + automation",
  description: "Explore where AI and connected workflows can remove repetitive work from your business. Discuss your current process, the tools you use and the tasks you want to simplify so we can scope a practical next step.",
  href: "/contact",
  benefits: ["Explore your workflow", "Identify repetitive tasks", "Scope a practical integration"],
});
