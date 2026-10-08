import { assetBase } from "./site-config";

export type Project = {
  slug: string;
  name: string;
  category: string;
  sector: string;
  description: string;
  overview: string;
  solution: string;
  url: string;
  displayUrl: string;
  image: string;
  alt: string;
  tags: readonly string[];
  keyFeatures: readonly string[];
  techStack: readonly string[];
  kind?: "software";
  /** Phone-size capture of the live site (390×844 @2x), when one exists. */
  mobileImage?: string;
  /** Set when the client's site is not currently reachable: the case study
      stays, but nothing labels it live or links visitors to the dead URL. */
  offline?: true;
  ctaLabel?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export const projects = [
  {
    slug: "jufaja-homes",
    name: "Jufaja Construction / Jufaja Homes",
    category: "Construction / Property Digital Platform",
    sector: "Property & construction",
    description: "Premium construction and property digital experience.",
    overview:
      "Premium digital platform for Jufaja, combining a polished property and construction experience with a modern, responsive interface.",
    solution:
      "We created a premium, responsive website presenting Jufaja's home designs and construction offering through clear catalogue navigation, design studies and dedicated enquiry pathways, with a refined forest-green and gold visual identity.",
    url: "https://jufaja-homes-platform.vercel.app/",
    displayUrl: "jufaja-homes-platform.vercel.app",
    image: `${assetBase}/ab-portfolio-jufaja-homes.webp`,
    mobileImage: `${assetBase}/ab-portfolio-jufaja-homes-mobile.webp`,
    alt: "Jufaja Constructions homepage with forest-green and gold branding, home design navigation and illustrative architecture",
    tags: ["Website Design", "UI/UX", "Frontend Development", "Responsive Development"],
    keyFeatures: [
      "Home design catalogue and category navigation",
      "Construction services and design study presentation",
      "Dedicated home, house and land, and display home enquiry pathways",
      "Responsive interface with reduced-motion-aware opening animation",
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    seoTitle: "Jufaja — Web Design & Development",
    seoDescription: "Premium website and digital experience created for Jufaja by AB Web Studio.",
  },
  {
    slug: "aftab-sons-transport",
    name: "Aftab & Sons Transport",
    category: "Transport / Logistics Website",
    sector: "Transport & logistics",
    description:
      "Premium transport and logistics website for an Australian heavy-vehicle transport company, with an industrial identity, responsive interface and conversion-focused presentation.",
    overview:
      "Aftab & Sons Transport needed a strong digital presence for its Australian truck transport, B-double freight, local delivery and interstate transport services.",
    solution:
      "We created a responsive industrial website with clear service and capability paths, motion-led storytelling, accessible reduced-motion behaviour and prominent quote enquiries across screen sizes.",
    url: "https://www.aftabandsons.com.au/",
    displayUrl: "aftabandsons.com.au",
    image: `${assetBase}/ab-portfolio-aftab-sons-transport.webp`,
    mobileImage: `${assetBase}/ab-portfolio-aftab-sons-transport-mobile.webp`,
    alt: "Aftab & Sons Transport website homepage with a branded B-double truck convoy",
    tags: ["Responsive Web Design", "Motion Design", "Transport & Logistics"],
    keyFeatures: [
      "Truck transport and B-double freight service presentation",
      "Local delivery and interstate capability pathways",
      "Responsive quote-focused interface",
      "Reduced-motion-aware animation system",
    ],
    techStack: ["React", "Tailwind CSS", "Framer Motion", "Responsive UI"],
  },
  {
    slug: "247-inventory-system",
    name: "247 Inventory System",
    category: "Custom Business Software / Inventory Management",
    sector: "Custom software",
    description:
      "Custom inventory and business management platform for 24/7 Truck Tyre Services, centralising tyre stock, operational workflows, sales and business records.",
    overview:
      "24/7 Truck Tyre Services needed a secure internal platform to manage inventory and purchasing alongside day-to-day sales, customer, job and finance workflows.",
    solution:
      "We built a role-protected business system covering stock control, transfers, purchasing, point of sale, quotes, invoices, receivables, customers, jobs and operational analytics in one interface.",
    url: "https://247trucktyreservices.store/",
    displayUrl: "247trucktyreservices.store",
    image: `${assetBase}/ab-portfolio-247-inventory-system.webp`,
    mobileImage: `${assetBase}/ab-portfolio-247-inventory-system-mobile.webp`,
    alt: "247 Inventory System secure staff sign-in screen for inventory and purchasing operations",
    tags: ["Inventory Management", "Sales & Invoicing", "Business Software"],
    keyFeatures: [
      "Tyre inventory, stock movement and transfer workflows",
      "Purchasing, suppliers and purchase order management",
      "Point of sale, quotes, invoices and receivables",
      "Secure staff access with operational dashboards",
    ],
    techStack: ["Next.js", "TypeScript", "Supabase", "PostgreSQL"],
    kind: "software",
    ctaLabel: "View System",
  },
  {
    slug: "adelaide-wholesale-tyres",
    name: "Adelaide Wholesale Tyres",
    category: "E-Commerce / Wholesale Platform",
    sector: "E-commerce",
    description:
      "A modern wholesale tyre platform built for Adelaide workshops, fleets, transport operators and trade buyers to browse live stock and order or request a quote.",
    overview:
      "Adelaide Wholesale Tyres supplies truck, commercial, 4WD and passenger tyres from a Regency Park warehouse and needed a digital storefront that made wholesale stock easy for workshops, fleet managers and trade customers to discover and purchase.",
    solution:
      "We built a wholesale e-commerce platform with a searchable tyre catalogue filtered by size, application and stock availability, cart-based bulk ordering, a wholesale quote workflow for fleet and recurring supply, and clear Adelaide delivery tiers and warehouse pickup information.",
    url: "https://adelaidewholesaletyres.com.au/",
    displayUrl: "adelaidewholesaletyres.com.au",
    image: `${assetBase}/ab-portfolio-adelaide-wholesale-tyres.webp`,
    mobileImage: `${assetBase}/ab-portfolio-adelaide-wholesale-tyres-mobile.webp`,
    alt: "Adelaide Wholesale Tyres wholesale tyre e-commerce website homepage designed by AB Web Studio",
    tags: ["Wholesale E-Commerce", "Tyre Catalogue", "Fleet Purchasing"],
    keyFeatures: [
      "Searchable wholesale tyre catalogue with live stock availability",
      "Tyre size, application and in-stock filtering",
      "Cart-based bulk ordering with wholesale quote workflow",
      "Adelaide delivery tiers and Regency Park warehouse pickup",
    ],
    techStack: ["Next.js", "TypeScript", "Responsive UI", "SEO Structure"],
  },
  {
    slug: "247-truck-tyre-services",
    name: "24/7 Truck Tyre Services",
    category: "Automotive / Roadside Assistance / Truck Tyre Services",
    sector: "Automotive",
    description:
      "A responsive roadside assistance website built to generate emergency service enquiries and present truck tyre support for commercial operators.",
    overview:
      "24/7 Truck Tyre Services needed a clear digital presence for Adelaide truck drivers, commercial operators and fleets looking for urgent roadside support, tyre supply and fitting services.",
    solution:
      "We developed a mobile-first automotive website with an emergency-led information architecture, service enquiry pathways, local search structure and prominent call-to-action elements for roadside assistance and fleet support.",
    url: "https://www.247trucktyreservices.com.au/",
    displayUrl: "247trucktyreservices.com.au",
    image: `${assetBase}/ab-portfolio-247-truck-tyre-services.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-247-truck-tyre-services-mobile.webp`,
    alt: "24/7 Truck Tyre Services website designed by AB Web Studio",
    tags: ["Emergency UX", "Automotive SEO", "Commercial Services"],
    keyFeatures: [
      "Emergency roadside assistance call-to-action pathways",
      "Truck tyre supply, fitting and service presentation",
      "National Roadside Assistance Program registration path",
      "Commercial fleet support and service enquiry structure",
    ],
    techStack: ["Next.js", "TypeScript", "Responsive UI", "SEO Structure"],
  },
  {
    slug: "maple-rentals",
    name: "Maple Rentals",
    category: "Mobility / Car rentals",
    sector: "Mobility",
    description: "Premium driver rentals and streamlined online applications.",
    overview:
      "Maple Rentals needed a digital platform that presented driver rental options with authority while giving applicants a direct, low-friction application path.",
    solution:
      "We built a structured web experience highlighting rental terms, vehicle tiers, and application requirements, connected directly to enquiry and application pathways.",
    url: "https://www.maplerentals.com.au/",
    displayUrl: "maplerentals.com.au",
    image: `${assetBase}/ab-portfolio-maple-rentals.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-maple-rentals-mobile.webp`,
    alt: "Maple Rentals website homepage preview",
    tags: ["UX Design", "Booking Journey", "Mobile Optimised"],
    keyFeatures: [
      "Vehicle fleet & rental tier showcase",
      "Streamlined online application pathway",
      "Clear driver eligibility & pricing breakdown",
      "Fast mobile navigation & responsive layout",
    ],
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
  },
  {
    slug: "gala-rentals",
    name: "Gala Rentals",
    category: "Mobility / Car rentals",
    sector: "Mobility",
    description: "A confident booking experience for weekly car rentals in Sydney.",
    overview:
      "Gala Rentals provides weekly car hire for Sydney drivers requiring clear terms, vehicle options, and quick booking requests.",
    solution:
      "We designed an accessible, mobile-first website that simplifies vehicle selection, highlights weekly rates, and provides a clear contact and enquiry system.",
    url: "https://www.galarentals.com.au/",
    displayUrl: "galarentals.com.au",
    image: `${assetBase}/ab-portfolio-gala-rentals.jpg`,
    // galarentals.com.au returned "Service Suspended" on 2026-10-08.
    offline: true,
    alt: "Gala Rentals website homepage preview",
    tags: ["Web Architecture", "Vehicle Showcase", "Local SEO"],
    keyFeatures: [
      "Weekly rate transparency and vehicle catalog",
      "Mobile-first reservation enquiry flow",
      "Local Sydney service area positioning",
      "Search-optimised page architecture",
    ],
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
  },
  {
    slug: "zq-removals",
    name: "ZQ Removals",
    category: "Services / Removals",
    sector: "Removals",
    description: "Local-service positioning and a direct path to quote requests.",
    overview:
      "ZQ Removals presents residential and commercial moving services in Adelaide with a direct path to quote enquiries.",
    solution:
      "We engineered a conversion-focused local service layout with clear service categories, coverage maps, and a fast multi-step quote request form.",
    url: "https://zqremovals.au/",
    displayUrl: "zqremovals.au",
    image: `${assetBase}/ab-portfolio-zq-removals.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-zq-removals-mobile.webp`,
    alt: "ZQ Removals website homepage preview",
    tags: ["Lead Conversion", "Local Service SEO", "Fast Touch-UI"],
    keyFeatures: [
      "Direct quote request form integration",
      "Adelaide service area positioning",
      "Residential vs commercial service breakdown",
      "Touch-optimised mobile call & enquiry triggers",
    ],
    techStack: ["HTML", "Vanilla CSS", "JavaScript", "JSON-LD"],
  },
  {
    slug: "decent-development",
    name: "DECENT Development",
    category: "Property / Development",
    sector: "Property & construction",
    description: "A refined digital presence for a Sydney construction business.",
    overview:
      "DECENT Development builds custom architectural homes and commercial developments in Sydney, needing a digital presence that reflects their craftsmanship.",
    solution:
      "We crafted a dark, sophisticated portfolio site emphasizing project photography, architectural specifications, and direct consultation booking.",
    url: "https://www.decentdevelopment.com.au/",
    displayUrl: "decentdevelopment.com.au",
    image: `${assetBase}/ab-portfolio-decent-development.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-decent-development-mobile.webp`,
    alt: "DECENT Development website homepage preview",
    tags: ["Brand Direction", "Portfolio Gallery", "Performance"],
    keyFeatures: [
      "Full-width architectural project gallery",
      "Detailed project specifications & build scope",
      "Dark luxury aesthetic matching brand identity",
      "Fast page load & image optimization",
    ],
    techStack: ["React", "Vite", "Tailwind CSS", "Framer Motion"],
  },
  {
    slug: "milestone-development",
    name: "Milestone Development",
    category: "Property / Construction",
    sector: "Property & construction",
    description: "A project-led showcase for residential and commercial construction.",
    overview:
      "Milestone Development needed a clean, corporate showcase to communicate their multi-sector construction capabilities and project history.",
    solution:
      "We built a project-centric digital platform with structured capability decks, completed project archives, and clear stakeholder contact paths.",
    url: "https://milestonedevelopment.com.au/",
    displayUrl: "milestonedevelopment.com.au",
    image: `${assetBase}/ab-portfolio-milestone-development.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-milestone-development-mobile.webp`,
    alt: "Milestone Development website homepage preview",
    tags: ["Project Showcase", "Responsive Design", "SEO Structure"],
    keyFeatures: [
      "Filterable project portfolio showcase",
      "Commercial & residential capability breakdown",
      "Corporate presentation & accreditation credentials",
      "Responsive accessibility-conscious structure",
    ],
    techStack: ["HTML", "CSS", "JavaScript", "GSAP"],
  },
  {
    slug: "4-point-concrete",
    name: "4 Point Concrete",
    category: "Construction / Civil",
    sector: "Property & construction",
    description: "Capability-focused presentation for concrete and structural works.",
    overview:
      "4 Point Concrete provides specialized concrete placement and structural civil services across commercial and industrial projects.",
    solution:
      "We created a capability-focused digital presentation detailing concrete specification options, equipment resources, and direct estimator enquiry channels.",
    url: "https://4point-concrete-website.vercel.app/",
    displayUrl: "4point-concrete-website.vercel.app",
    image: `${assetBase}/ab-portfolio-four-point-concrete.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-4-point-concrete-mobile.webp`,
    alt: "4 Point Concrete website homepage preview",
    tags: ["Capability Deck", "Civil Services", "Mobile UX"],
    keyFeatures: [
      "Detailed civil & structural capability presentation",
      "Project estimator & tender inquiry pathway",
      "Industrial equipment & safety accreditation display",
      "High-contrast mobile UX for site managers",
    ],
    techStack: ["Next.js", "Vite", "TypeScript", "Tailwind CSS"],
  },
  {
    slug: "1st-class-express",
    name: "1st Class Express",
    category: "Transport & Logistics Website",
    sector: "Transport & logistics",
    description:
      "Interstate freight positioning, a clear fleet showcase and a fast path to quote enquiries on every screen size.",
    overview:
      "1st Class Express provides interstate road freight and logistics services across Australia requiring immediate quote generation and fleet presentation.",
    solution:
      "We designed an interstate logistics platform featuring freight service breakdowns, fleet asset specifications, and an easy quote enquiry system.",
    url: "https://www.1stclassexpress.com.au/",
    displayUrl: "1stclassexpress.com.au",
    image: `${assetBase}/ab-portfolio-1st-class-express.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-1st-class-express-mobile.webp`,
    alt: "1st Class Express transport and logistics website homepage preview",
    tags: ["Freight Positioning", "Fleet Showcase", "Quote Engine"],
    keyFeatures: [
      "Interstate freight route & service presentation",
      "Fleet capacity & vehicle specification breakdown",
      "Express freight quote request engine",
      "Mobile-optimised driver & depot contact points",
    ],
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
  },
  {
    slug: "hf-removals-adelaide",
    name: "HF Removals Adelaide",
    category: "Services / Removals",
    sector: "Removals",
    description:
      "Published reference rates, an instant quote request and round-the-clock enquiry capture.",
    overview:
      "HF Removals Adelaide handles residential, apartment, office and interstate moves from an Elizabeth Vale base, needing pricing transparency and a quote path that converts around the clock.",
    solution:
      "We built a rate-transparent removals platform pairing published local and per-cubic-metre interstate pricing with an above-the-fold instant quote form, suburb and route landing pages, and review-backed trust signals.",
    url: "https://www.hfremovalsadelaide.com/",
    displayUrl: "hfremovalsadelaide.com",
    image: `${assetBase}/ab-portfolio-hf-removals.jpg`,
    mobileImage: `${assetBase}/ab-portfolio-hf-removals-adelaide-mobile.webp`,
    alt: "HF Removals Adelaide website homepage preview",
    tags: ["Quote Conversion", "Local Service SEO", "Rate Transparency"],
    keyFeatures: [
      "Above-the-fold instant quote request form",
      "Published local rates and per-cubic-metre interstate routes",
      "Adelaide suburb and interstate route landing pages",
      "Google review and insurance trust signals throughout",
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "JSON-LD"],
  },
  {
    slug: "cheap-adelaide-removalist",
    name: "Cheap Adelaide Removalist",
    category: "Services / Removals",
    sector: "Removals",
    description:
      "A conversion-focused removals platform for Adelaide, built to make pricing, services and quote requests easy to understand while building a strong local-search content foundation.",
    overview:
      "Cheap Adelaide Removalist needed a digital presence that could compete on trust and clarity rather than just price — publishing transparent hourly rates, service coverage and a fast quote path for house, apartment, office and interstate moves across Greater Adelaide.",
    solution:
      "We built a rate-transparent local service platform anchored by a Bento-style pricing and logistics engine: published per-30-minute crew rates with a stated no-hidden-surcharges policy, a move-sizer and crew-allocator module, suburb-level arterial coverage content, eight dedicated service pages, a four-step process explainer, an extensive FAQ and a detailed multi-field quote request form.",
    url: "https://www.cheapadelaideremovalist.com.au/",
    displayUrl: "cheapadelaideremovalist.com.au",
    image: `${assetBase}/ab-portfolio-cheap-adelaide-removalist.png`,
    mobileImage: `${assetBase}/ab-portfolio-cheap-adelaide-removalist-mobile.webp`,
    alt: "Cheap Adelaide Removalist website homepage showing published moving rates and a branded removals truck",
    tags: ["Local SEO Architecture", "Quote Conversion", "Transparent Pricing UX"],
    keyFeatures: [
      "Bento-style pricing and logistics engine with a move-sizer and crew allocator",
      "Published per-30-minute rates with a zero-hidden-surcharge policy",
      "Eight dedicated service pages plus suburb and arterial coverage content",
      "Multi-field quote request form with property access and inventory scoping",
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "JSON-LD"],
  },
] as const satisfies readonly Project[];

export const sectors: readonly string[] = Array.from(new Set(projects.map((project) => project.sector)));

export function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function isSoftwareProject(project: Project): boolean {
  return project.kind === "software";
}

export function isLiveProject(project: Project): boolean {
  return !project.offline;
}

/** The status label shown on cards: never "live" for an offline site. */
export function projectStatusLabel(project: Project): string {
  if (project.offline) return "Case study";
  return isSoftwareProject(project) ? "Live system" : "Live website";
}

/** Editorial label form of a category: "Mobility / Car rentals" → "Mobility · Car rentals". */
export function formatCategory(category: string): string {
  return category.split("/").map((part) => part.trim()).filter(Boolean).join(" · ");
}
