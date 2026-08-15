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

/**
 * Portfolio screenshots with the studio watermark baked into the pixels.
 *
 * Generated from the originals in `assetBase` by `npm run watermark`. Project
 * imagery must be served from here so the branding survives being saved and
 * reposted; `tests/project-watermark.test.mjs` enforces that.
 *
 * The version is part of the path because these assets are served
 * `immutable, max-age=31536000`. Restyling the mark therefore has to produce a
 * new URL, or caches would keep serving the old watermark. Bump this together
 * with WATERMARK_VERSION in scripts/watermark-projects.mjs.
 */
export const WATERMARK_VERSION = 2;
export const watermarkedAssetBase = `${assetBase}/watermarked/v${WATERMARK_VERSION}`;
