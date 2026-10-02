import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
    icons: [
      { src: "/brand/ab-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/brand/ab-mark-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/ab-mark-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
