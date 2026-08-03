export const servicePages = [
  {
    slug: "web-design-sydney",
    title: "Web Design Sydney",
    summary: "Premium, responsive websites designed around your customers, your offer and the enquiries your business needs.",
    intro: "We combine clear positioning, confident visual design and dependable Next.js development to give Sydney businesses a website that earns attention and turns it into action.",
    benefits: ["Custom UX and visual direction", "Responsive, accessible development", "Conversion-focused content structure", "Launch and analytics foundations"],
  },
  {
    slug: "ecommerce-website-development",
    title: "E-commerce Website Development",
    summary: "Fast, trustworthy online stores that make products easy to explore and purchasing feel effortless.",
    intro: "From product architecture to checkout, we create mobile-first commerce experiences that support confident buying today and give your catalogue room to grow.",
    benefits: ["Product and collection strategy", "Mobile commerce UX", "Secure checkout integration", "Performance and search foundations"],
  },
  {
    slug: "seo-local-visibility",
    title: "SEO & Local Visibility",
    summary: "Search-ready foundations that help the right customers find and understand your business.",
    intro: "We improve technical structure, page intent and local relevance so search engines can confidently connect your services with customers across Sydney and Australia.",
    benefits: ["Technical SEO review", "On-page optimisation", "Local search structure", "Measurement and improvement plan"],
  },
  {
    slug: "branding-content",
    title: "Branding & Website Content",
    summary: "A coherent visual direction and persuasive words that make your business easier to recognise and trust.",
    intro: "We shape the visual and verbal system behind your website, turning what makes your business valuable into a consistent experience customers can understand quickly.",
    benefits: ["Brand direction", "Website messaging", "Content hierarchy", "Campaign-ready creative"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    summary: "Focused campaigns and landing pages designed to attract attention and generate qualified enquiries.",
    intro: "We connect campaign strategy, creative and conversion journeys so your marketing has a clear audience, a compelling message and a measurable next step.",
    benefits: ["Campaign strategy", "Landing page design", "Lead-generation journeys", "Tracking foundations"],
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance & Support",
    summary: "Practical ongoing care that keeps your website current, secure and performing after launch.",
    intro: "We stay available for content updates, technical maintenance and measured improvements, giving your business a dependable digital partner as priorities change.",
    benefits: ["Content updates", "Technical health checks", "Performance improvements", "Priority support"],
  },
] as const;

export type ServicePage = (typeof servicePages)[number];

export function findService(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}
