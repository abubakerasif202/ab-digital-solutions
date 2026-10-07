export const servicePages = [
  {
    slug: "web-design-sydney",
    title: "Web Design Sydney",
    summary: "Premium, responsive websites designed around your customers, your offer and the enquiries your business needs.",
    intro: "Custom website design and Next.js development for Sydney businesses that need a clearer, more credible path from first visit to genuine enquiry.",
    detailTitle: "A website shaped around the decision your customer needs to make.",
    detail: "We bring positioning, content hierarchy, responsive UX and dependable development into one delivery process. Each build is shaped around your audience and offer, with accessibility-conscious implementation, technical SEO foundations and clear review points—without relying on a generic template.",
    benefits: ["Custom UX and visual direction", "Responsive, accessibility-conscious development", "Conversion-focused content structure", "Launch and measurement foundations"],
    featuredProject: "maple-rentals",
  },
  {
    slug: "ecommerce-website-development",
    title: "E-commerce Website Development",
    summary: "Fast, trustworthy online stores that make products easy to explore and purchasing feel effortless.",
    intro: "Mobile-first e-commerce experiences for Australian retailers and suppliers that need products to be easy to browse, understand and buy.",
    detailTitle: "A storefront built around how customers browse and buy.",
    detail: "We structure product catalogues, collections, navigation and checkout journeys around the way customers shop. Platform, payment and customer-management integrations are scoped to the store’s real operational needs, with performance and search foundations considered from the start.",
    benefits: ["Product and collection strategy", "Mobile commerce UX", "Checkout integration", "Performance and search foundations"],
    featuredProject: "adelaide-wholesale-tyres",
  },
  {
    slug: "seo-local-visibility",
    title: "SEO & Local Visibility",
    summary: "Search-ready foundations that help the right customers find and understand your business.",
    intro: "Technical SEO and local visibility work that helps search engines and qualified customers understand where your business fits.",
    detailTitle: "Search visibility starts with a clearer technical and content foundation.",
    detail: "We review architecture, page intent, content structure, schema, performance and local search signals, then turn the findings into a practical improvement plan. The focus is durable clarity and discoverability—not ranking guarantees or volume for its own sake.",
    benefits: ["Technical SEO review", "On-page optimisation", "Local search structure", "Measurement and improvement plan"],
    featuredProject: "zq-removals",
  },
  {
    slug: "branding-content",
    title: "Branding & Website Content",
    summary: "A coherent visual direction and persuasive words that make your business easier to recognise and trust.",
    intro: "Brand direction and website content that make an Australian business easier to recognise, understand and choose.",
    detailTitle: "A visual and verbal system that feels true to the business behind it.",
    detail: "We clarify positioning, value propositions, message hierarchy and visual direction before applying them across website content and campaign touchpoints. The result is a coherent foundation your team can use consistently, rather than a collection of disconnected design assets.",
    benefits: ["Brand direction", "Website messaging", "Content hierarchy", "Campaign-ready creative"],
    featuredProject: "decent-development",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    summary: "Focused campaigns and landing pages designed to attract attention and generate qualified enquiries.",
    intro: "Focused landing pages and campaign foundations that connect audience attention to a clear, measurable next step.",
    detailTitle: "Campaign journeys that stay aligned from first impression to enquiry.",
    detail: "We connect campaign direction, creative, landing-page structure and measurement around one commercial goal. Scope can include custom landing pages, lead-generation pathways, tracking foundations and iterative content improvements, with recommendations tied to the evidence available.",
    benefits: ["Campaign strategy", "Landing page design", "Lead-generation journeys", "Tracking foundations"],
    featuredProject: "milestone-development",
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance & Support",
    summary: "Practical ongoing care that keeps your website current, secure and performing after launch.",
    intro: "Ongoing website care for Australian businesses that need their digital presence to stay current, dependable and useful after launch.",
    detailTitle: "Practical care for the website your business already depends on.",
    detail: "Support can cover content updates, framework and dependency maintenance, technical health checks, performance work and measured feature improvements. Priorities and response expectations are agreed clearly, so ongoing work stays connected to the site’s real operational needs.",
    benefits: ["Content updates", "Technical health checks", "Performance improvements", "Priority support"],
    featuredProject: "4-point-concrete",
  },
] as const;

export type ServicePage = (typeof servicePages)[number];

export function findService(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}

// Delivery details stay beside the canonical service definitions.
export const serviceDelivery: Record<ServicePage["slug"], {
  steps: readonly [string, string][];
  question: string;
  answer: string;
  layers: readonly [string, string, string];
}> = {
  "web-design-sydney": {
    steps: [["Understand the audience", "Clarify the offer, existing content and the decisions visitors need to make."], ["Structure the experience", "Map pages, navigation and enquiry paths before refining the visual direction."], ["Develop responsively", "Build the interface across screen sizes with accessible interactions and search foundations."], ["Check and launch", "Review content, navigation and forms together before publishing."]],
    question: "Can the website include custom application features?",
    answer: "We can scope web application and business system requirements alongside the website. The 247 Inventory System case study shows our work with stock, purchasing and sales workflows; your own requirements determine the appropriate scope.",
    layers: ["Content & navigation", "Responsive interface", "Enquiry journey"],
  },
  "ecommerce-website-development": {
    steps: [["Map the catalogue", "Understand products, collections, stock information and the way customers buy."], ["Design product discovery", "Shape filtering, product information and mobile browsing around that catalogue."], ["Connect the purchase path", "Scope cart, checkout, payment and quote requirements around operational needs."], ["Review the full journey", "Check browsing, ordering and customer information before launch."]],
    question: "Can an online store support wholesale enquiries?",
    answer: "Yes, where it fits the business. Adelaide Wholesale Tyres combines a searchable catalogue, cart-based bulk ordering and a wholesale quote workflow. We agree the purchasing and enquiry paths your store needs before building.",
    layers: ["Product catalogue", "Cart & quote journey", "Order requirements"],
  },
  "seo-local-visibility": {
    steps: [["Inspect the foundations", "Review architecture, page intent, schema and technical search signals."], ["Prioritise the findings", "Create a practical plan based on the evidence and business priorities."], ["Improve the pages", "Refine content structure, on-page signals and local search clarity."], ["Review the evidence", "Use available measurement to choose the next useful improvement."]],
    question: "Do you guarantee search rankings?",
    answer: "No. The work focuses on technical clarity, relevant content and local search foundations. Recommendations are based on available evidence rather than ranking promises.",
    layers: ["Page intent", "Technical structure", "Local relevance"],
  },
  "branding-content": {
    steps: [["Clarify the positioning", "Understand the audience, offer and existing brand materials."], ["Define the direction", "Align visual identity and message hierarchy with the business."], ["Create the content", "Apply the direction to website words and relevant creative touchpoints."], ["Check consistency", "Review the complete experience for a coherent visual and verbal system."]],
    question: "Can you retain our existing identity?",
    answer: "Yes. We review existing materials first and agree which elements to preserve, refine or extend. The direction is shaped around the business rather than replacing a working identity by default.",
    layers: ["Business positioning", "Visual direction", "Website messaging"],
  },
  "digital-marketing": {
    steps: [["Define the campaign goal", "Agree the audience, offer and action the campaign should support."], ["Connect the journey", "Align creative and landing-page content with that action."], ["Build the destination", "Create the lead-generation path and scope measurement foundations."], ["Review and refine", "Use available evidence to improve the content and customer journey."]],
    question: "Can you improve an existing campaign landing page?",
    answer: "Yes. We can review message alignment, content hierarchy, enquiry pathways and tracking foundations, then recommend a focused scope based on the evidence available.",
    layers: ["Audience & offer", "Landing experience", "Enquiry & measurement"],
  },
  "website-maintenance": {
    steps: [["Review the existing site", "Understand the current framework, content and operational dependencies."], ["Agree priorities", "Define support scope, response expectations and the most useful improvements."], ["Make focused changes", "Deliver updates, technical care and performance improvements with review points."], ["Validate the result", "Check affected journeys and agree the next maintenance priorities."]],
    question: "Can you maintain a site built by someone else?",
    answer: "We start by reviewing its current framework, access and technical condition. That review determines the support we can reliably provide and whether any groundwork is needed first.",
    layers: ["Existing website", "Focused improvements", "Technical checks"],
  },
};
