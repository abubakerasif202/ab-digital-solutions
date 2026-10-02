const configuredPublicEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export const siteConfig = {
  name: "AB Web Studio",
  shortName: "AB Web Studio",
  description:
    "Sydney digital studio designing and building premium websites, web applications and custom business systems for ambitious Australian businesses.",
  url: "https://www.abwebstudio.com.au",
  // Keep public contact details centralised. Set NEXT_PUBLIC_CONTACT_EMAIL only
  // after the branded mailbox has been created and verified.
  email: configuredPublicEmail || "enquiry@abwebstudio.com.au",
  phoneDisplay: "0423 332 037",
  phoneInternational: "+61423332037",
  location: "Sydney, Australia",
} as const;

export const assetBase = "/site/ab-digital-premium/assets";
