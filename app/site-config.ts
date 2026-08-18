const configuredPublicEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export const siteConfig = {
  name: "AB Digital Solutions",
  shortName: "AB Digital",
  description:
    "Sydney web design agency creating premium, fast and search-ready websites, SEO and digital growth strategies for ambitious Australian businesses.",
  url: "https://www.abwebstudio.com.au",
  // Keep public contact details centralised. Set NEXT_PUBLIC_CONTACT_EMAIL only
  // after the branded mailbox has been created and verified.
  email: configuredPublicEmail || "abubakerasif202@yahoo.com",
  phoneDisplay: "0423 332 037",
  phoneInternational: "+61423332037",
  location: "Sydney, Australia",
} as const;

export const assetBase = "/site/ab-digital-premium/assets";
