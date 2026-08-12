import { assetBase } from "./site-config";

export type Project = {
  slug: string;
  name: string;
  category: string;
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
};

export const projects = [
  {
    slug: "maple-rentals",
    name: "Maple Rentals",
    category: "Mobility / Car rentals",
    description: "Premium driver rentals and streamlined online applications.",
    overview:
      "Maple Rentals needed a digital platform that presented driver rental options with authority while giving applicants a direct, low-friction application path.",
    solution:
      "We built a structured web experience highlighting rental terms, vehicle tiers, and application requirements, connected directly to enquiry and application pathways.",
    url: "https://www.maplerentals.com.au/",
    displayUrl: "maplerentals.com.au",
    image: `${assetBase}/ab-portfolio-maple-rentals.jpg`,
    alt: "Maple Rentals website homepage preview",
    tags: ["UX Design", "Booking Journey", "Mobile Optimised"],
    keyFeatures: [
      "Vehicle fleet & rental tier showcase",
      "Streamlined online application pathway",
      "Clear driver eligibility & pricing breakdown",
      "Fast mobile navigation & responsive layout",
    ],
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "SEO Schema"],
  },
  {
    slug: "gala-rentals",
    name: "Gala Rentals",
    category: "Mobility / Car rentals",
    description: "A confident booking experience for weekly car rentals in Sydney.",
    overview:
      "Gala Rentals provides weekly car hire for Sydney drivers requiring clear terms, vehicle options, and quick booking requests.",
    solution:
      "We designed an accessible, mobile-first website that simplifies vehicle selection, highlights weekly rates, and provides a clear contact and enquiry system.",
    url: "https://www.galarentals.com.au/",
    displayUrl: "galarentals.com.au",
    image: `${assetBase}/ab-portfolio-gala-rentals.jpg`,
    alt: "Gala Rentals website homepage preview",
    tags: ["Web Architecture", "Vehicle Showcase", "Local SEO"],
    keyFeatures: [
      "Weekly rate transparency and vehicle catalog",
      "Mobile-first reservation enquiry flow",
      "Local Sydney service area positioning",
      "Search-optimised page architecture",
    ],
    techStack: ["React", "Next.js", "CSS Modules", "Schema.org"],
  },
  {
    slug: "zq-removals",
    name: "ZQ Removals",
    category: "Services / Removals",
    description: "Local-service positioning and a direct path to quote requests.",
    overview:
      "ZQ Removals delivers residential and commercial moving services across Sydney requiring local discoverability and instant quote conversion.",
    solution:
      "We engineered a conversion-focused local service layout with clear service categories, coverage maps, and a fast multi-step quote request form.",
    url: "https://zqremovals.au/",
    displayUrl: "zqremovals.au",
    image: `${assetBase}/ab-portfolio-zq-removals.jpg`,
    alt: "ZQ Removals website homepage preview",
    tags: ["Lead Conversion", "Local Service SEO", "Fast Touch-UI"],
    keyFeatures: [
      "Direct quote request form integration",
      "Local service area & suburb targeting",
      "Residential vs commercial service breakdown",
      "Touch-optimised mobile call & enquiry triggers",
    ],
    techStack: ["Next.js", "TypeScript", "Vanilla CSS", "JSON-LD"],
  },
  {
    slug: "decent-development",
    name: "DECENT Development",
    category: "Property / Development",
    description: "A refined digital presence for a Sydney construction business.",
    overview:
      "DECENT Development builds custom architectural homes and commercial developments in Sydney, needing a digital presence that reflects their craftsmanship.",
    solution:
      "We crafted a dark, sophisticated portfolio site emphasizing project photography, architectural specifications, and direct consultation booking.",
    url: "https://www.decentdevelopment.com.au/",
    displayUrl: "decentdevelopment.com.au",
    image: `${assetBase}/ab-portfolio-decent-development.jpg`,
    alt: "DECENT Development website homepage preview",
    tags: ["Brand Direction", "Portfolio Gallery", "Performance"],
    keyFeatures: [
      "Full-width architectural project gallery",
      "Detailed project specifications & build scope",
      "Dark luxury aesthetic matching brand identity",
      "Fast page load & image optimization",
    ],
    techStack: ["Next.js", "React", "Tailwind CSS", "Vercel"],
  },
  {
    slug: "milestone-development",
    name: "Milestone Development",
    category: "Property / Construction",
    description: "A project-led showcase for residential and commercial construction.",
    overview:
      "Milestone Development needed a clean, corporate showcase to communicate their multi-sector construction capabilities and project history.",
    solution:
      "We built a project-centric digital platform with structured capability decks, completed project archives, and clear stakeholder contact paths.",
    url: "https://milestonedevelopment.com.au/",
    displayUrl: "milestonedevelopment.com.au",
    image: `${assetBase}/ab-portfolio-milestone-development.jpg`,
    alt: "Milestone Development website homepage preview",
    tags: ["Project Showcase", "Responsive Design", "SEO Structure"],
    keyFeatures: [
      "Filterable project portfolio showcase",
      "Commercial & residential capability breakdown",
      "Corporate presentation & accreditation credentials",
      "Responsive accessibility-conscious structure",
    ],
    techStack: ["Next.js", "TypeScript", "CSS Modules", "HTML5"],
  },
  {
    slug: "4-point-concrete",
    name: "4 Point Concrete",
    category: "Construction / Civil",
    description: "Capability-focused presentation for concrete and structural works.",
    overview:
      "4 Point Concrete provides specialized concrete placement and structural civil services across commercial and industrial projects.",
    solution:
      "We created a capability-focused digital presentation detailing concrete specification options, equipment resources, and direct estimator enquiry channels.",
    url: "https://4-point-concrete-design.vercel.app/",
    displayUrl: "4-point-concrete-design.vercel.app",
    image: `${assetBase}/ab-portfolio-four-point-concrete.jpg`,
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
    description:
      "Interstate freight positioning, a clear fleet showcase and a fast path to quote enquiries on every screen size.",
    overview:
      "1st Class Express provides interstate road freight and logistics services across Australia requiring immediate quote generation and fleet presentation.",
    solution:
      "We designed an interstate logistics platform featuring freight service breakdowns, fleet asset specifications, and an easy quote enquiry system.",
    url: "https://www.1stclassexpress.com.au/",
    displayUrl: "1stclassexpress.com.au",
    image: `${assetBase}/ab-portfolio-1st-class-express.jpg`,
    alt: "1st Class Express transport and logistics website homepage preview",
    tags: ["Freight Positioning", "Fleet Showcase", "Quote Engine"],
    keyFeatures: [
      "Interstate freight route & service presentation",
      "Fleet capacity & vehicle specification breakdown",
      "Express freight quote request engine",
      "Mobile-optimised driver & depot contact points",
    ],
    techStack: ["Next.js", "TypeScript", "Vanilla CSS", "JSON-LD"],
  },
] as const satisfies readonly Project[];

export function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
