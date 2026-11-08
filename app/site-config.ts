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
  // Only owner-confirmed profile URLs are listed (tracking parameters removed). Both can be
  // overridden with NEXT_PUBLIC_FACEBOOK_URL / NEXT_PUBLIC_INSTAGRAM_URL. 
  social: {
    linkedin: "https://www.linkedin.com/in/abubakar-asif-247908316",
    github: "https://github.com/abubakerasif202",
    facebook: optionalUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL) ?? "https://www.facebook.com/abubakarasif202",
    instagram: optionalUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL) ?? "https://www.instagram.com/abubakarasif202",
  },
} as const;

export const assetBase = "/site/ab-digital-premium/assets";
