export const servicePages = [
  {
    slug: "web-design-sydney",
    title: "Web Design Sydney",
    summary: "Premium, responsive websites designed around your customers, your offer and the enquiries your business needs.",
    intro: "AB Digital Solutions provides custom website design and Next.js development for Sydney businesses, local service providers, logistics firms, property developers, and commercial enterprises. We combine strategic positioning, confident visual design, responsive layouts, and engineering precision to build digital presences that earn attention, establish trust, and turn visitors into active customer enquiries. Every website build incorporates tailored user experience (UX) direction, WCAG accessibility compliance, conversion-conscious messaging, technical SEO foundations, and fast page load speeds. Designed to support sustainable commercial growth across Sydney, Melbourne, Brisbane, and Australia-wide, our studio delivers transparent project milestones and long-term technical reliability without relying on generic templates or unoptimized frameworks.",
    benefits: ["Custom UX and visual direction", "Responsive, accessible development", "Conversion-focused content structure", "Launch and analytics foundations"],
    featuredProject: "Maple Rentals",
  },
  {
    slug: "ecommerce-website-development",
    title: "E-commerce Website Development",
    summary: "Fast, trustworthy online stores that make products easy to explore and purchasing feel effortless.",
    intro: "AB Digital Solutions delivers custom e-commerce website development for Australian retail brands, B2B suppliers, and growing storefronts seeking fast, friction-conscious online purchasing experiences. From product catalog architecture to secure payment gateway and checkout integrations, we engineer mobile-first commerce platforms that make products simple to explore, purchasing feel effortless, and store scaling straightforward. Our e-commerce solutions prioritize responsive mobile navigation, optimized page load speeds, structured product data schema, search engine visibility, and seamless customer management. Whether launching a new store or migrating an existing catalog, we provide Australian businesses with dependable online commerce technology built for high conversion, operational clarity, and sustainable revenue growth.",
    benefits: ["Product and collection strategy", "Mobile commerce UX", "Secure checkout integration", "Performance and search foundations"],
    featuredProject: "Gala Rentals",
  },
  {
    slug: "seo-local-visibility",
    title: "SEO & Local Visibility",
    summary: "Search-ready foundations that help the right customers find and understand your business.",
    intro: "AB Digital Solutions offers technical SEO and local search visibility services designed to help Australian businesses get discovered by qualified local customers across Sydney, Melbourne, Brisbane, and nationwide. We optimize technical site architecture, page intent alignment, structured schema markup, and local search signals so search engines like Google and AI search systems can confidently understand and rank your services. Our search optimization strategy focuses on technical health audits, performance enhancements, keyword targeting, content structure refinement, and local business citations. By creating search-ready web foundations aligned with genuine user intent, we help service providers, commercial businesses, and local operators build durable organic visibility and attract consistent commercial enquiries.",
    benefits: ["Technical SEO review", "On-page optimisation", "Local search structure", "Measurement and improvement plan"],
    featuredProject: "ZQ Removals",
  },
  {
    slug: "branding-content",
    title: "Branding & Website Content",
    summary: "A coherent visual direction and persuasive words that make your business easier to recognise and trust.",
    intro: "AB Digital Solutions provides comprehensive brand direction, positioning strategy, and website copywriting services that turn what makes your business valuable into a coherent, persuasive digital experience. We shape the visual and verbal systems behind your brand, creating clear messaging hierarchies, distinctive brand aesthetics, and confident copy that make your business instantly recognizable, trustworthy, and easy to choose. Our branding process covers visual identity guidelines, website messaging, campaign creative, and value proposition clarity. Designed for ambitious Australian service businesses, property firms, and growing companies, we deliver clear communication assets that elevate brand perception, reinforce commercial authority, and drive customer engagement across all digital touchpoints.",
    benefits: ["Brand direction", "Website messaging", "Content hierarchy", "Campaign-ready creative"],
    featuredProject: "DECENT Development",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    summary: "Focused campaigns and landing pages designed to attract attention and generate qualified enquiries.",
    intro: "AB Digital Solutions designs high-converting digital marketing campaigns, conversion-focused landing pages, and strategic customer acquisition funnels for Australian businesses. We connect campaign strategy, compelling ad creative, landing page user experiences, and lead generation pathways so your marketing efforts deliver clear audience targeting, measurable engagement, and qualified enquiries. Our digital marketing solutions include custom landing page development, conversion rate optimization (CRO), analytics and tracking setup, and campaign creative direction. By aligning marketing messaging directly with business growth goals, we help service providers, commercial enterprises, and growing brands turn campaign traffic into profitable, predictable customer actions.",
    benefits: ["Campaign strategy", "Landing page design", "Lead-generation journeys", "Tracking foundations"],
    featuredProject: "Milestone Development",
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance & Support",
    summary: "Practical ongoing care that keeps your website current, secure and performing after launch.",
    intro: "AB Digital Solutions offers ongoing website maintenance, technical support, and continuous performance care for Australian businesses after launch. We provide reliable post-launch assistance covering content updates, security patches, core framework updates, technical health monitoring, and speed optimizations, giving your business a dependable digital partner as priorities evolve. Our maintenance programs protect website security, maintain search engine rankings, ensure continuous accessibility, and implement measured feature enhancements over time. Operating across Sydney and Australia-wide, our studio provides transparent communication, rapid technical issue resolution, and dedicated site care so your online presence remains secure, fast, and commercially effective.",
    benefits: ["Content updates", "Technical health checks", "Performance improvements", "Priority support"],
    featuredProject: "4 Point Concrete",
  },
] as const;

export type ServicePage = (typeof servicePages)[number];

export function findService(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}
