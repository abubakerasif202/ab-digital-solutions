const deploymentUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteConfig = {
  name: "AB Digital Solutions",
  shortName: "AB Digital",
  description:
    "Sydney web design agency creating premium, fast and search-ready websites, SEO and digital growth strategies for ambitious Australian businesses.",
  url: deploymentUrl
    ? `${deploymentUrl.startsWith("http") ? "" : "https://"}${deploymentUrl}`.replace(/\/$/, "")
    : "https://ab-digital-solutions.sites.chatgpt.com",
  email: "abubakerasif202@yahoo.com",
  phoneDisplay: "0423 332 037",
  phoneInternational: "+61423332037",
  location: "Sydney, Australia",
} as const;

export const assetBase = "/site/ab-digital-premium/assets";
