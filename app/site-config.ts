const configuredPublicEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

const optionalUrl = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed?.startsWith("https://") ? trimmed : undefined;
};

export const siteConfig = {
  name: "AB Web Studio",
  shortName: "AB Web Studio",
  description:
    "Sydney digital studio building premium websites, online stores and custom business systems for Australian businesses.",
  url: "https://www.abwebstudio.com.au",
  // Keep public contact details centralised. Set NEXT_PUBLIC_CONTACT_EMAIL only
  // after the branded mailbox has been created and verified.
  email: configuredPublicEmail || "enquiry@abwebstudio.com.au",
  phoneDisplay: "0423 332 037",
  phoneInternational: "+61423332037",
  location: "Sydney, NSW, Australia",
  // Only profiles with a confirmed URL are listed. Instagram has no URL yet, so it stays hidden
  // until NEXT_PUBLIC_INSTAGRAM_URL is set. The Facebook link is the owner-supplied share URL.
  social: {
    linkedin: "https://www.linkedin.com/company/ab-digital-solutions",
    github: "https://github.com/abubakerasif202",
    facebook: optionalUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL) ?? "https://www.facebook.com/share/1CGfu8s7Az/",
    instagram: optionalUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  },
} as const;

export const assetBase = "/site/ab-digital-premium/assets";
