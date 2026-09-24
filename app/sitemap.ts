import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";
import { projects } from "./project-data";

// Static content-change dates (never the current build time, which would make
// every build differ). Bump the relevant constant when that content actually changes.
const HOME_LAST_MODIFIED = "2026-09-23";
const WORK_LAST_MODIFIED = "2026-09-25";
const SERVICES_LAST_MODIFIED = "2026-09-23";
const PRIVACY_LAST_MODIFIED = "2026-08-05";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/work`,
      lastModified: WORK_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map(({ slug }) => ({
      url: `${siteConfig.url}/work/${slug}`,
      lastModified: WORK_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/services`,
      lastModified: SERVICES_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...servicePages.map(({ slug }) => ({
      url: `${siteConfig.url}/services/${slug}`,
      lastModified: SERVICES_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: PRIVACY_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];
}
