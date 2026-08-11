import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";
import { servicePages } from "./services/service-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...servicePages.map(({ slug }) => ({
      url: `${siteConfig.url}/services/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/privacy`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];
}
