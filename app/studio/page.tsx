import { StudioArrow } from "./StudioArrow";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../site-chrome";
import { SiteFooter } from "../site-footer";
import { StudioExperience } from "./StudioExperience";
import { studioProjects, studioServices } from "./studio-data";
import { siteConfig } from "../site-config";
import styles from "./studio.module.css";

const description = "Step inside AB Web Studio. Explore an interactive architectural studio, real project case studies, web design, SEO, branding and AI automation, then start a conversation.";
export const metadata: Metadata = {
  title: "The Virtual Studio",
  description,
  alternates: { canonical: "/studio" },
  openGraph: { title: "The Virtual Studio | AB Web Studio", description, url: "/studio", images: [{ url: "/studio/studio-poster.png", width: 1440, height: 900, alt: "AB Web Studio original architectural virtual studio" }] },
  twitter: { card: "summary_large_image", title: "The Virtual Studio | AB Web Studio", description, images: ["/studio/studio-poster.png"] },
};

export default function StudioPage() {
  return <>
    <SiteHeader />
    <main id="main-content" className={styles.page}>
      <header className={styles.introduction}>
        <div><p className={styles.kicker}>AB / Spatial edition · 01</p><h1>A different <em>perspective.</em></h1></div>
        <p>A place for ideas to take shape.<br /> Step inside our virtual studio.</p>
      </header>
      <StudioExperience projects={studioProjects} services={studioServices} />
      <section id="studio-content" className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryIntro}><p className={styles.kicker}>Beyond the space</p><h2 id="directory-title">Good design opens <em>doors.</em></h2><p>The studio is a virtual expression of AB Web Studio, an independent digital studio in Sydney. Explore the same work and services here, with or without 3D.</p><Link href="/contact" className={styles.primary}>Get a Quote <StudioArrow /></Link></div>
        <div className={styles.directoryItems}>
          <article><p className={styles.kicker}>01 / Reception</p><h3>Welcome to AB.</h3><p>Design-led websites. Purpose-built technology. Meet the studio and the thinking behind the work.</p><Link href="/about">Meet the studio <StudioArrow /></Link></article>
          <article><p className={styles.kicker}>02 / Portfolio gallery</p><h3>Real work. Real context.</h3><p>Explore {studioProjects.length} project case studies, including public websites, hosted showcases and business systems. Each case study explains its destination.</p><details><summary>Browse the projects</summary><ul>{studioProjects.map((project) => <li key={project.slug}><Link href={`/work/${project.slug}`}>{project.name}</Link></li>)}</ul></details><Link href="/work">View all work <StudioArrow /></Link></article>
          <article><p className={styles.kicker}>03 / Services atelier</p><h3>From ambition to execution.</h3><ul>{studioServices.map((service) => <li key={service.title}><Link href={service.href}>{service.title}</Link></li>)}</ul><Link href="/services">Explore services <StudioArrow /></Link></article>
          <article><p className={styles.kicker}>04 / Consultation lounge</p><h3>Bring your next idea.</h3><p>Share your business, your goals and what you already have. Use our existing enquiry form to start the conversation.</p><Link href="/contact">Start your project <StudioArrow /></Link></article>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "The Virtual Studio", description, url: `${siteConfig.url}/studio`, isPartOf: { "@id": `${siteConfig.url}/#website` } }).replace(/</g, "\\u003c") }} />
    </main>
    <SiteFooter currentYear={new Date().getUTCFullYear()} />
  </>;
}
