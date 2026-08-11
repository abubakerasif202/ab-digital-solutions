export const servicePages = [
  {
    slug: "web-design-sydney",
    title: "Web Design Sydney",
    summary: "Premium, responsive websites designed around your customers, your offer and the enquiries your business needs.",
    intro: "Custom website design and Next.js development for Sydney businesses that need a clearer, more credible path from first visit to genuine enquiry.",
    detailTitle: "A website shaped around the decision your customer needs to make.",
    detail: "We bring positioning, content hierarchy, responsive UX and dependable development into one delivery process. Each build is shaped around your audience and offer, with accessibility-conscious implementation, technical SEO foundations and clear review points—without relying on a generic template.",
    benefits: ["Custom UX and visual direction", "Responsive, accessibility-conscious development", "Conversion-focused content structure", "Launch and measurement foundations"],
    featuredProject: "Maple Rentals",
  },
  {
    slug: "ecommerce-website-development",
    title: "E-commerce Website Development",
    summary: "Fast, trustworthy online stores that make products easy to explore and purchasing feel effortless.",
    intro: "Mobile-first e-commerce experiences for Australian retailers and suppliers that need products to be easy to browse, understand and buy.",
    detailTitle: "A storefront built around how customers browse and buy.",
    detail: "We structure product catalogues, collections, navigation and checkout journeys around the way customers shop. Platform, payment and customer-management integrations are scoped to the store’s real operational needs, with performance and search foundations considered from the start.",
    benefits: ["Product and collection strategy", "Mobile commerce UX", "Checkout integration", "Performance and search foundations"],
    featuredProject: "Gala Rentals",
  },
  {
    slug: "seo-local-visibility",
    title: "SEO & Local Visibility",
    summary: "Search-ready foundations that help the right customers find and understand your business.",
    intro: "Technical SEO and local visibility work that helps search engines and qualified customers understand where your business fits.",
    detailTitle: "Search visibility starts with a clearer technical and content foundation.",
    detail: "We review architecture, page intent, content structure, schema, performance and local search signals, then turn the findings into a practical improvement plan. The focus is durable clarity and discoverability—not ranking guarantees or volume for its own sake.",
    benefits: ["Technical SEO review", "On-page optimisation", "Local search structure", "Measurement and improvement plan"],
    featuredProject: "ZQ Removals",
  },
  {
    slug: "branding-content",
    title: "Branding & Website Content",
    summary: "A coherent visual direction and persuasive words that make your business easier to recognise and trust.",
    intro: "Brand direction and website content that make an Australian business easier to recognise, understand and choose.",
    detailTitle: "A visual and verbal system that feels true to the business behind it.",
    detail: "We clarify positioning, value propositions, message hierarchy and visual direction before applying them across website content and campaign touchpoints. The result is a coherent foundation your team can use consistently, rather than a collection of disconnected design assets.",
    benefits: ["Brand direction", "Website messaging", "Content hierarchy", "Campaign-ready creative"],
    featuredProject: "DECENT Development",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    summary: "Focused campaigns and landing pages designed to attract attention and generate qualified enquiries.",
    intro: "Focused landing pages and campaign foundations that connect audience attention to a clear, measurable next step.",
    detailTitle: "Campaign journeys that stay aligned from first impression to enquiry.",
    detail: "We connect campaign direction, creative, landing-page structure and measurement around one commercial goal. Scope can include custom landing pages, lead-generation pathways, tracking foundations and iterative content improvements, with recommendations tied to the evidence available.",
    benefits: ["Campaign strategy", "Landing page design", "Lead-generation journeys", "Tracking foundations"],
    featuredProject: "Milestone Development",
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance & Support",
    summary: "Practical ongoing care that keeps your website current, secure and performing after launch.",
    intro: "Ongoing website care for Australian businesses that need their digital presence to stay current, dependable and useful after launch.",
    detailTitle: "Practical care for the website your business already depends on.",
    detail: "Support can cover content updates, framework and dependency maintenance, technical health checks, performance work and measured feature improvements. Priorities and response expectations are agreed clearly, so ongoing work stays connected to the site’s real operational needs.",
    benefits: ["Content updates", "Technical health checks", "Performance improvements", "Priority support"],
    featuredProject: "4 Point Concrete",
  },
] as const;

export type ServicePage = (typeof servicePages)[number];

export function findService(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}
