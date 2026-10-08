import { findProject, type Project } from "../project-data";

/* Industry hubs group the canonical portfolio by the kind of business it
   serves. Every project in the registry belongs to exactly one industry, and
   every proof point on an industry page is read from that project's own
   registry entry (features, stack, live URL) — nothing here is a statistic,
   testimonial or claim that is not already published in the case studies. */
export type Industry = {
  slug: string;
  name: string;
  title: string;
  summary: string;
  intro: string;
  focusTitle: string;
  focus: readonly (readonly [string, string])[];
  projects: readonly string[];
  services: readonly string[];
};

export const industries = [
  {
    slug: "removalist-websites",
    name: "Removals",
    title: "Websites for removalists",
    summary: "Removals websites that publish clear rates, capture quote requests fast and build local search coverage suburb by suburb.",
    intro:
      "People choosing a removalist compare quickly and decide on trust. The removals sites we have built lead with transparent pricing, a quote path that works on a phone and local content that matches how customers search.",
    focusTitle: "What a removals website has to get right.",
    focus: [
      ["Transparent pricing", "Published rates and clear inclusions so customers can judge value before they call."],
      ["Quote capture", "A quote request above the fold and on every page, scoped to the details a crew actually needs."],
      ["Local search coverage", "Suburb, service-area and route content structured for local search."],
    ],
    projects: ["hf-removals-adelaide", "cheap-adelaide-removalist", "zq-removals"],
    services: ["seo-local-visibility", "web-design-sydney", "digital-marketing"],
  },
  {
    slug: "transport-logistics-websites",
    name: "Transport & logistics",
    title: "Websites for transport and logistics companies",
    summary: "Transport and freight websites that present fleet capability with authority and turn interest into quote enquiries.",
    intro:
      "Freight customers want to know what you move, where you run and how to get a quote. Our transport work presents services, routes and fleet capability clearly, with quote enquiries a tap away on every screen size.",
    focusTitle: "What a transport website has to get right.",
    focus: [
      ["Capability at a glance", "Freight types, routes and fleet presented in the order a customer evaluates them."],
      ["Industrial credibility", "A visual identity that feels as dependable as the fleet behind it."],
      ["Quote-first journeys", "Request-a-quote pathways prominent from the first screen to the last."],
    ],
    projects: ["aftab-sons-transport", "1st-class-express"],
    services: ["web-design-sydney", "branding-content", "seo-local-visibility"],
  },
  {
    slug: "construction-property-websites",
    name: "Construction & property",
    title: "Websites for builders, developers and construction companies",
    summary: "Construction and property websites that let the built work lead, communicate capability and open the right enquiry path.",
    intro:
      "In construction the projects are the pitch. Our builder and developer sites put project imagery and specifications first, explain capability clearly and route homeowners, clients and estimators to the enquiry that suits them.",
    focusTitle: "What a construction website has to get right.",
    focus: [
      ["Project-led presentation", "Galleries, design studies and completed work given room to be seen properly."],
      ["Capability and credentials", "Residential, commercial and civil capability explained without jargon."],
      ["Separate enquiry paths", "Distinct routes for home designs, consultations and tender or estimator enquiries."],
    ],
    projects: ["jufaja-homes", "decent-development", "milestone-development", "4-point-concrete"],
    services: ["web-design-sydney", "branding-content", "website-maintenance"],
  },
  {
    slug: "car-rental-websites",
    name: "Car rentals",
    title: "Websites for car rental businesses",
    summary: "Car rental websites that make weekly rates, vehicles and eligibility clear, with an application or booking path built for mobile.",
    intro:
      "Rental customers are usually on a phone and comparing options. Our rental work shows vehicles and weekly rates plainly, spells out eligibility and gets applicants into a short, structured application or booking request.",
    focusTitle: "What a rental website has to get right.",
    focus: [
      ["Rates and vehicles up front", "Weekly pricing, tiers and the fleet presented before the form."],
      ["Eligibility made clear", "Requirements explained early so applications arrive complete."],
      ["Mobile application flow", "A short, structured application or reservation path designed for thumbs."],
    ],
    projects: ["maple-rentals", "gala-rentals"],
    services: ["web-design-sydney", "seo-local-visibility", "digital-marketing"],
  },
  {
    slug: "automotive-tyre-websites",
    name: "Automotive & tyres",
    title: "Websites and systems for automotive and tyre businesses",
    summary: "Automotive websites, wholesale tyre e-commerce and custom inventory software built around how workshops, fleets and drivers actually buy.",
    intro:
      "Tyre and automotive businesses run on urgency, stock and trade relationships. Our work in this sector spans an emergency-led roadside website, a wholesale tyre store with live stock, and the internal inventory system behind the counter.",
    focusTitle: "What an automotive business needs online.",
    focus: [
      ["Urgency-first UX", "Emergency call pathways that work under pressure, on the side of the road."],
      ["Trade purchasing", "Searchable stock, bulk ordering and quote workflows for fleets and workshops."],
      ["Operational software", "Inventory, purchasing, sales and invoicing connected in one secure system."],
    ],
    projects: ["247-truck-tyre-services", "adelaide-wholesale-tyres", "247-inventory-system"],
    services: ["ecommerce-website-development", "web-design-sydney", "website-maintenance"],
  },
] as const satisfies readonly Industry[];

export function findIndustry(slug: string): Industry | undefined {
  return industries.find((industry) => industry.slug === slug);
}

/** Resolve an industry's project slugs; throws at build time if the registry drifts. */
export function industryProjects(industry: Industry): Project[] {
  return industry.projects.map((slug) => {
    const project = findProject(slug);
    if (!project) throw new Error(`industry-data: unknown project slug "${slug}" in ${industry.slug}`);
    return project;
  });
}

/** The industry a project belongs to (each project belongs to exactly one). */
export function industryForProject(slug: string): Industry | undefined {
  return industries.find((industry) => (industry.projects as readonly string[]).includes(slug));
}
