import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BrandIntro } from "./components/intro/BrandIntro";
import { introGateScript } from "./components/intro/intro-gate";
import { PointerFX } from "./components/PointerFX";
import { siteConfig } from "./site-config";
import { WebVitals } from "./web-vitals";
import "./globals.css";
import "./studio.css";
import "./motion.css";
import "./intro.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "Web Design Sydney & Digital Agency | AB Web Studio",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "web design Sydney",
    "website development Australia",
    "Sydney web design agency",
    "SEO services Australia",
    "small business websites Sydney",
    "AB Web Studio",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Web design and development",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "AB Web Studio | Websites Built to Earn Attention",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AB Web Studio website design and digital growth studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Sydney | AB Web Studio",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/brand/ab-luxury-mark-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/ab-luxury-mark-64.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/brand/ab-luxury-mark-32.png",
    apple: "/brand/ab-luxury-mark-180.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070708",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/brand/ab-logo-luxury-source.png`,
      image: `${siteConfig.url}/opengraph-image`,
      description: siteConfig.description,
      telephone: siteConfig.phoneInternational,
      email: siteConfig.email,
      areaServed: { "@type": "Country", name: "Australia" },
      sameAs: [
        "https://github.com/abubakerasif202",
        "https://www.linkedin.com/company/ab-digital-solutions",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sydney",
        addressRegion: "NSW",
        addressCountry: "AU",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: siteConfig.phoneInternational,
        email: siteConfig.email,
        contactType: "sales",
        areaServed: "AU",
        availableLanguage: "English",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Digital services",
        itemListElement: [
          "Website design and development",
          "SEO and local visibility",
          "Branding and content",
          "E-commerce solutions",
          "Digital marketing",
          "Website care and support",
        ].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name },
        })),
      },
    },
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/#founder`,
      name: "Abubakar Asif",
      jobTitle: "Founder & Lead Developer",
      worksFor: { "@id": `${siteConfig.url}/#organization` },
      sameAs: ["https://github.com/abubakerasif202"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "en-AU",
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
  ],
};

// Self-hosted at build time so every platform gets the intended pairing:
// a humanist sans for interface and headings, an old-style serif for accents.
const sansFont = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// The serif only ever renders at 400 (accents, project names), so a single
// static weight replaces the variable-weight file on the critical path.
const displayFont = Source_Serif_4({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  display: "swap",
  variable: "--font-display",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${sansFont.variable} ${displayFont.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: introGateScript }} />
        <BrandIntro />
        <WebVitals />
        <PointerFX />
        {children}
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
