import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ab-digital-solutions.sites.chatgpt.com"),
  other: { "codex-preview": "development" },
  title: "AB Digital Solutions | Premium Websites & Digital Growth",
  description:
    "AB Digital Solutions creates premium websites, SEO strategies and digital experiences that help Australian businesses grow.",
  keywords: [
    "website design Sydney",
    "web development Australia",
    "SEO services",
    "digital marketing",
    "AB Digital Solutions",
  ],
  openGraph: {
    title: "AB Digital Solutions | Premium Websites & Digital Growth",
    description:
      "Premium websites, SEO and digital growth solutions for Australian businesses.",
    type: "website",
    locale: "en_AU",
    images: [
      {
        url: "/site/ab-digital-premium/assets/ab-hero-website-creation.png",
        width: 1942,
        height: 809,
        alt: "AB Digital Solutions website creation presentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AB Digital Solutions | Premium Websites & Digital Growth",
    description:
      "Premium websites, SEO and digital growth solutions for Australian businesses.",
    images: ["/site/ab-digital-premium/assets/ab-hero-website-creation.png"],
  },
  icons: {
    icon: "/site/ab-digital-premium/assets/ab-logo-mark.png",
    shortcut: "/site/ab-digital-premium/assets/ab-logo-mark.png",
    apple: "/site/ab-digital-premium/assets/ab-logo-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "AB Digital Solutions",
  description:
    "Website design, development, SEO, branding and digital marketing for Australian businesses.",
  telephone: "+61 423 332 037",
  email: "abubakerasif202@yahoo.com",
  areaServed: "Australia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
