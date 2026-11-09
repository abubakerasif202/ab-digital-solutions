import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnchorSettle } from "./components/AnchorSettle";
import { siteConfig } from "./site-config";
import { WebVitals } from "./web-vitals";
import "./globals.css";
import "./motion.css";
import "./intro.css";
import "./styles/new-design.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "AB Web Studio | Web Design Studio in Sydney",
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
    title: "Web Design Sydney & Custom Business Systems | AB Web Studio",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AB Web Studio — websites and custom business systems" }],
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
  themeColor: "#f5f3ed",
  colorScheme: "light",
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
      sameAs: [siteConfig.social.linkedin, siteConfig.social.github, siteConfig.social.facebook, siteConfig.social.instagram].filter((url): url is string => Boolean(url)),
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
          "Custom software and business systems",
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
      sameAs: [siteConfig.social.github, siteConfig.social.linkedin],
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

// A single grotesk carries both expressive headlines and practical interface copy.
const sansFont = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Preload the display face for editorial headlines. The optical-size axis
// keeps hairlines crisp from small cards to oversized hero.
const displayFont = Schibsted_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
});

// Labels only: two weights, never on the critical path.
const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
  display: "swap",
  variable: "--font-mono",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" data-scroll-behavior="smooth" className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body className="new-design">
        <WebVitals />
        <AnchorSettle />
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
