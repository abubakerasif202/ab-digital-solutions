import type { MetadataRoute } from "next";
import { assetBase, siteConfig } from "./site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: `${assetBase}/ab-logo-mark.png`,
        sizes: "400x340",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
