import type { Metadata, Viewport } from "next";
import { assetBase, siteConfig } from "./site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "Web Design Sydney & Digital Agency | AB Digital Solutions",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "web design Sydney",
    "website development Australia",
    "Sydney web design agency",
    "SEO services Australia",
    "small business websites Sydney",
    "AB Digital Solutions",
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
    title: "AB Digital Solutions | Websites Built to Earn Attention",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_AU",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AB Digital Solutions website design and digital growth studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design Sydney | AB Digital Solutions",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    // Apple touch icons must be square; the old logo mark was 400x340.
    apple: { url: "/icons/icon-192.png", sizes: "180x180" },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
  colorScheme: "dark light",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}${assetBase}/ab-logo-mark.png`,
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
