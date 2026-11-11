import type { ContactServiceKey } from "../contact-options";

export type ServiceProof = {
  /** Project slug from the canonical portfolio registry. */
  slug: string;
  /** What this project demonstrates for the service, shown on the project card. */
  role: string;
};

export type ServiceFaq = { question: string; answer: string };

type ServiceDefinition = {
  slug: string;
  /** Short name used in navigation, cards and breadcrumbs. */
  title: string;
  /** On-page H1; carries the commercial and local search intent. */
  h1: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  intro: string;
  detailTitle: string;
  detail: string;
  benefits: readonly string[];
  /** Primary project; drives the hero visual and the service index preview. */
  featuredProject: string;
  /** Key passed as `?service=` so the enquiry form opens with this service selected. */
  contactKey: ContactServiceKey;
  ctaLabel: string;
  /** Primary case study first, then two supporting projects. */
  proof: readonly [ServiceProof, ServiceProof, ServiceProof];
  faqs: readonly [ServiceFaq, ServiceFaq, ServiceFaq, ServiceFaq];
};

export const servicePages = [
  {
    slug: "web-design-sydney",
    title: "Web Design Sydney",
    h1: "Web Design Sydney",
    seoTitle: "Web Design Sydney | Custom Next.js Websites | AB Web Studio",
    seoDescription: "Custom web design and Next.js development in Sydney for Australian businesses that need fast, conversion-focused websites built to generate qualified enquiries.",
    summary: "Premium, responsive websites designed around your customers, your offer and the enquiries your business needs.",
    intro: "Custom websites and website redesigns for Sydney and Australian businesses that need a clearer path from first visit to genuine enquiry.",
    detailTitle: "A website shaped around the decision your customer needs to make.",
    detail: "We bring positioning, content hierarchy, responsive UX and dependable development into one delivery process. We can modernise an existing site or build a new one, with accessibility-conscious implementation, technical SEO foundations and clear review points. Custom dashboards, integrations and operational workflows can be scoped alongside the public website.",
    benefits: ["Custom UX and visual direction", "Responsive, accessibility-conscious development", "Conversion-focused content structure", "Launch and measurement foundations"],
    featuredProject: "maple-rentals",
    contactKey: "web-design",
    ctaLabel: "Start a project",
    proof: [
      { slug: "maple-rentals", role: "Mobility / Car rentals" },
      { slug: "milestone-renovate", role: "Renovation / Planning Platform" },
      { slug: "aftab-sons-transport", role: "Transport & Logistics" },
    ],
    faqs: [
      {
        question: "Can the website include custom calculators, booking flows or application features?",
        answer: "Yes. Because we engineer sites in React, Next.js and TypeScript rather than restrictive page-builder templates, we can build custom quote calculators, driver application portals, or role-protected dashboards directly into your website.",
      },
      {
        question: "How much does a custom website design in Sydney typically cost?",
        answer: "Focused service websites and high-converting landing platforms typically range from $2,000 to $4,000, while larger multi-page commercial websites with custom interactions, CMS architectures or booking flows generally scope between $4,000 and $8,000+. You receive a fixed-price written proposal before any work begins.",
      },
      {
        question: "How long does it take to design and launch a new website?",
        answer: "Most standard business websites move from initial discovery to live launch in 2 to 4 weeks, depending on content readiness and custom functionality. We establish clear review milestones early so your launch date stays predictable.",
      },
      {
        question: "Will my new website be fast on mobile and ready for Google search?",
        answer: "Every site is engineered mobile-first with clean semantic markup, optimised imagery, fast Core Web Vitals performance, and foundational LocalBusiness JSON-LD schema baked in before launch.",
      },
    ],
  },
  {
    slug: "ecommerce-website-development",
    title: "E-commerce Website Development",
    h1: "E-Commerce Website Development Sydney",
    seoTitle: "E-Commerce Website Development Sydney | Online Stores | AB Web Studio",
    seoDescription: "Mobile-first e-commerce website development in Sydney. We build fast online stores, B2B wholesale portals and searchable product catalogues for Australian suppliers.",
    summary: "Fast, trustworthy online stores that make products easy to explore and purchasing feel effortless.",
    intro: "Mobile-first e-commerce experiences for Australian retailers and suppliers that need products to be easy to browse, understand and buy.",
    detailTitle: "A storefront built around how customers browse and buy.",
    detail: "We structure product catalogues, collections, navigation and checkout journeys around the way customers shop. Platform, payment and customer-management integrations are scoped to the store’s real operational needs, with performance and search foundations considered from the start.",
    benefits: ["Product and collection strategy", "Mobile commerce UX", "Checkout integration", "Performance and search foundations"],
    featuredProject: "adelaide-wholesale-tyres",
    contactKey: "ecommerce",
    ctaLabel: "Start a project",
    proof: [
      { slug: "adelaide-wholesale-tyres", role: "B2B Wholesale Platform" },
      { slug: "fresh-stop", role: "Grocery & Fresh Produce Online Catalogue" },
      { slug: "pept-up-labs", role: "E-Commerce Product Catalogue" },
    ],
    faqs: [
      {
        question: "Can an online store support B2B wholesale enquiries as well as direct checkout?",
        // Adelaide Wholesale Tyres and Fresh Stop use cart-based enquiries, not online payment, so the
        // answer says that plainly and offers checkout as an addition rather than as demonstrated work.
        answer: "Yes. Our builds for Adelaide Wholesale Tyres and Fresh Stop show cart-based quote requests and trade pricing enquiries for commercial accounts, and we can add instant online checkout through a payment gateway such as Stripe where retail buyers need it.",
      },
      {
        question: "What does custom e-commerce website development cost?",
        answer: "Product catalogue websites and quote-driven storefronts typically start from $3,500 to $6,000, while full e-commerce platforms with payment gateways, live inventory syncing, custom filtering and database backends generally scope from $6,000 to $12,000+.",
      },
      {
        question: "Can you connect our online store to an inventory or warehouse management system?",
        answer: "Yes. We build custom PostgreSQL and Supabase backends as well as API integrations that synchronise product stock levels, SKU data, purchasing and invoicing across your storefront and internal staff systems.",
      },
      {
        question: "How do you keep mobile checkout fast for customers on the go?",
        answer: "We eliminate heavy third-party plugin bloat, design thumb-friendly product filtering, and streamline cart and address steps so mobile buyers can filter stock and complete an order or quote request in seconds.",
      },
    ],
  },
  {
    slug: "seo-local-visibility",
    title: "SEO & Local Visibility",
    h1: "SEO & Local Search Visibility Sydney",
    seoTitle: "Local SEO Sydney & Technical Search Optimisation | AB Web Studio",
    seoDescription: "Technical SEO, JSON-LD structured data, Core Web Vitals engineering and local search optimisation in Sydney to help qualified customers find your business.",
    summary: "Search-ready foundations that help the right customers find and understand your business.",
    intro: "Technical SEO and local visibility work that helps search engines and qualified customers understand where your business fits.",
    detailTitle: "Search visibility starts with a clearer technical and content foundation.",
    detail: "We review architecture, page intent, content structure, schema, performance and local search signals, then turn the findings into a practical improvement plan. The focus is durable clarity and discoverability—not ranking guarantees or volume for its own sake.",
    benefits: ["Technical SEO review", "On-page optimisation", "Local search structure", "Measurement and improvement plan"],
    featuredProject: "zq-removals",
    contactKey: "seo",
    ctaLabel: "Start a project",
    proof: [
      { slug: "zq-removals", role: "Local-Service Positioning & JSON-LD" },
      { slug: "wild-pest-solutions", role: "NSW Regional & Local Search Foundation" },
      { slug: "cheap-adelaide-removalist", role: "Local Search Architecture & Rate Transparency" },
    ],
    faqs: [
      {
        question: "Why don't you offer guaranteed #1 Google rankings?",
        answer: "No agency controls Google's algorithm, and \"guaranteed ranking\" packages usually rely on low-value keywords or risky link schemes. Instead, we focus on verifiable engineering: technical crawlability, Core Web Vitals speed, suburb and service-area architecture, and structured data that drive genuine customer enquiries.",
      },
      {
        question: "What is included in a Technical & Local SEO engagement?",
        answer: "We audit and upgrade your page hierarchy, title and meta intent, internal linking, LocalBusiness and Service JSON-LD schema, Core Web Vitals performance, Google Search Console indexing health, and local Sydney/Australian geographic relevance.",
      },
      {
        question: "How is SEO & Local Visibility work priced?",
        answer: "Foundational technical SEO audits and on-page implementation sprints typically range from $1,500 to $3,500 as a fixed-scope project, with optional ongoing monthly search growth and local landing-page expansion tailored to your market competition.",
      },
      {
        question: "Can you fix the SEO on an existing website without rebuilding it from scratch?",
        answer: "Yes. If your current codebase is structurally sound, we implement technical fixes, schema markup and content restructuring directly. If legacy template bloat is actively holding back your mobile speed and indexing, we will show you the evidence and compare the ROI of a clean rebuild.",
      },
    ],
  },
  {
    slug: "branding-content",
    title: "Branding & Website Content",
    h1: "Branding & Website Content Sydney",
    seoTitle: "Brand Identity & Website Copywriting Sydney | AB Web Studio",
    seoDescription: "Cohesive brand direction, visual identity systems and conversion-focused website copywriting in Sydney for ambitious Australian service and trade businesses.",
    summary: "A coherent visual direction and persuasive words that make your business easier to recognise and trust.",
    intro: "Brand direction and website content that make an Australian business easier to recognise, understand and choose.",
    detailTitle: "A visual and verbal system that feels true to the business behind it.",
    detail: "We clarify positioning, value propositions, message hierarchy and visual direction before applying them across website content and campaign touchpoints. The result is a coherent foundation your team can use consistently, rather than a collection of disconnected design assets.",
    benefits: ["Brand direction", "Website messaging", "Content hierarchy", "Campaign-ready creative"],
    featuredProject: "decent-development",
    contactKey: "branding",
    ctaLabel: "Start a project",
    proof: [
      { slug: "decent-development", role: "Property & Development Identity" },
      { slug: "jufaja-homes", role: "Architectural Brand Direction & UI System" },
      { slug: "wild-pest-solutions", role: "Brand Positioning & Service Copywriting" },
    ],
    faqs: [
      {
        question: "Can you refine our existing brand identity rather than starting over?",
        answer: "Yes. If your logo and name already carry local recognition, we preserve that equity while sharpening your colour contrast, typography hierarchy, and messaging so your business looks authoritative on modern digital screens.",
      },
      {
        question: "Do you write the website copywriting from scratch?",
        answer: "Yes. Most business owners don't have time to stare at a blank document. Through a structured discovery interview, we extract your commercial strengths and write clear, persuasive Australian English copy structured to guide visitors toward an enquiry.",
      },
      {
        question: "What deliverables do we receive in a Branding & Content scope?",
        answer: "Depending on your scope, deliverables include your visual direction system (colour palette, typography scale, UI component styling), brand messaging hierarchy, complete page-by-page website copywriting, and campaign-ready creative assets.",
      },
      {
        question: "How is Branding & Website Content priced?",
        answer: "Standalone website copywriting and messaging architecture typically scopes from $1,200 to $2,500, while comprehensive brand direction paired with custom website design is scoped transparently inside a unified project proposal.",
      },
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    h1: "Digital Marketing & Landing Pages Sydney",
    seoTitle: "Conversion Landing Pages & Digital Marketing Sydney | AB Web Studio",
    seoDescription: "High-converting campaign landing pages, quote funnels, GA4 conversion tracking and digital marketing foundations built in Sydney for measurable lead generation.",
    summary: "Focused campaigns and landing pages designed to attract attention and generate qualified enquiries.",
    intro: "Focused landing pages and campaign foundations that connect audience attention to a clear, measurable next step.",
    detailTitle: "Campaign journeys that stay aligned from first impression to enquiry.",
    detail: "We connect campaign direction, creative, landing-page structure and measurement around one commercial goal. Scope can include custom landing pages, lead-generation pathways, tracking foundations and iterative content improvements, with recommendations tied to the evidence available.",
    benefits: ["Campaign strategy", "Landing page design", "Lead-generation journeys", "Tracking foundations"],
    featuredProject: "milestone-development",
    contactKey: "marketing",
    ctaLabel: "Start a project",
    proof: [
      { slug: "milestone-development", role: "Project-Led Conversion Showcase" },
      { slug: "hf-removals-adelaide", role: "Instant Quote Capture & Lead Funnel" },
      { slug: "gala-rentals", role: "Direct Weekly Rental Booking Funnel" },
    ],
    faqs: [
      {
        question: "Why focus on custom landing pages instead of sending ad traffic to our homepage?",
        answer: "Homepages are built for general exploration, whereas paid search and social clicks need an immediate match to the exact service the customer just searched for. Dedicated landing pages with focused proof and instant quote forms significantly lower your cost per enquiry.",
      },
      {
        question: "What tracking and attribution foundations do you set up?",
        answer: "We configure Google Analytics 4 (GA4), Google Tag Manager, conversion linkers, phone-click and form-submission event tracking, and clean UTM capture so you know exactly which campaigns generate real phone calls and quote requests.",
      },
      {
        question: "Can you upgrade an underperforming campaign landing page we already run?",
        answer: "Yes. We audit your current message alignment, above-the-fold clarity, mobile load speed, and form friction, then either refactor the existing page or deploy a high-speed custom landing experience.",
      },
      {
        question: "How are Digital Marketing and landing page projects priced?",
        answer: "Custom conversion landing pages and tracking setups typically scope between $1,500 and $3,500 depending on interactive calculators or CRM integrations, with ongoing campaign landing-page experimentation scoped cleanly against your goals.",
      },
    ],
  },
  {
    slug: "website-maintenance",
    title: "Website Maintenance & Support",
    h1: "Website Maintenance & Ongoing Support",
    seoTitle: "Website Maintenance, Support & Next.js Care Sydney | AB Web Studio",
    seoDescription: "Reliable website maintenance, technical health checks, security patching and ongoing Next.js and React support in Sydney for Australian businesses.",
    summary: "Practical ongoing care that keeps your website current, secure and performing after launch.",
    intro: "Ongoing website care for Australian businesses that need their digital presence to stay current, dependable and useful after launch.",
    detailTitle: "Practical care for the website your business already depends on.",
    detail: "Support can cover content updates, framework and dependency maintenance, technical health checks, performance work and measured feature improvements. Priorities and response expectations are agreed clearly, so ongoing work stays connected to the site’s real operational needs.",
    benefits: ["Content updates", "Technical health checks", "Performance improvements", "Agreed support scope"],
    featuredProject: "247-truck-tyre-services",
    contactKey: "maintenance",
    ctaLabel: "Start a project",
    proof: [
      { slug: "247-truck-tyre-services", role: "24/7 Emergency Enquiry Reliability" },
      { slug: "aftab-sons-transport", role: "Ongoing Performance & Fleet Updates" },
      { slug: "fresh-stop", role: "Catalogue & Database Care" },
    ],
    faqs: [
      {
        question: "Can you maintain and support a website built by another developer or agency?",
        answer: "Yes. We begin with a quick technical codebase and hosting audit to verify framework versions, repository access and deployment pipelines, then establish a dependable support arrangement or fix immediate bugs first.",
      },
      {
        question: "What happens when we need urgent content updates or technical fixes?",
        answer: "Maintenance clients have direct access to our Sydney studio without ticket-queue runarounds. Routine content, pricing or catalogue updates and dependency patches are handled promptly within agreed turnaround windows.",
      },
      {
        question: "What technical checks do you perform behind the scenes?",
        answer: "We monitor uptime, SSL certificates, Next.js/React/Node security advisories, database health, broken links, Core Web Vitals regressions, and enquiry form delivery so your site never silently drops leads.",
      },
      {
        question: "Do we need a monthly retainer, or can we book support in focused blocks?",
        answer: "We offer both. Businesses with active catalogues, frequent promotions or critical operational systems typically choose an ongoing monthly care plan, while smaller brochure sites can book structured improvement sprints as needed.",
      },
    ],
  },
  {
    slug: "custom-software-business-systems",
    title: "Custom Software & Business Systems",
    h1: "Custom Business Software & Web Applications",
    seoTitle: "Custom Business Software & Web Applications Sydney | AB Web Studio",
    seoDescription: "Custom business software, inventory systems, staff portals and web applications engineered in Sydney with Next.js, TypeScript, Supabase and PostgreSQL.",
    summary: "Role-protected web applications, inventory platforms and internal tools built around the way your team works.",
    intro: "Role-protected web applications, inventory platforms and internal tools built around the exact workflows your team runs every day.",
    detailTitle: "Software shaped around the way your business actually operates.",
    detail: "Off-the-shelf software often forces your team into clumsy workarounds or expensive per-seat licences. We design and engineer custom web applications using Next.js, TypeScript, Supabase and PostgreSQL that bring stock control, purchasing, customer quoting, invoicing and staff operations into one fast, secure interface.",
    benefits: ["Inventory, stock & purchasing systems", "Staff portals & role-based dashboards", "Quote engines, invoicing & CRM workflows", "Supabase, PostgreSQL & API integrations"],
    featuredProject: "247-inventory-system",
    contactKey: "custom-software",
    ctaLabel: "Scope Your System",
    proof: [
      { slug: "247-inventory-system", role: "Custom Inventory, Purchasing & Sales Platform" },
      { slug: "fresh-stop", role: "Custom Prisma + PostgreSQL Catalogue & Cart Enquiry Engine" },
      { slug: "milestone-renovate", role: "Guided Planning Tools & Supabase Workflow" },
    ],
    faqs: [
      {
        question: "When does a business need custom software instead of off-the-shelf SaaS tools?",
        answer: "When your team is stitching together spreadsheets, WhatsApp messages and multiple disconnected subscriptions just to track stock, dispatch jobs or price quotes. Custom software centralises your exact workflow with zero per-user licence fees.",
      },
      {
        question: "How much does custom business software or an internal web app cost?",
        answer: "Focused internal tools, custom quote engines or role-protected staff portals typically start from $4,000 to $8,000, while comprehensive multi-role inventory, purchasing, dispatch and invoicing platforms generally scope between $8,000 and $18,000+ delivered in clear milestones.",
      },
      {
        question: "How is sensitive company and customer data secured?",
        answer: "We engineer systems on enterprise-grade PostgreSQL and Supabase infrastructure featuring strict Row-Level Security (RLS), role-based staff authentication, encrypted connections, and automated database backups.",
      },
      {
        question: "Can our custom software integrate with our public website or existing tools?",
        answer: "Yes. Your public website and internal software can share a unified database—allowing customers to browse live stock or submit quote requests online while staff manage inventory, approvals and invoicing from a private dashboard.",
      },
    ],
  },
] as const satisfies readonly ServiceDefinition[];

export type ServicePage = (typeof servicePages)[number];

export function findService(slug: string): ServicePage | undefined {
  return servicePages.find((service) => service.slug === slug);
}

/** `/contact` link that opens the enquiry form with this service preselected. */
export function serviceContactHref(service: Pick<ServicePage, "contactKey">): string {
  return `/contact?service=${service.contactKey}`;
}

// Delivery details stay beside the canonical service definitions.
export const serviceDelivery: Record<ServicePage["slug"], {
  steps: readonly [string, string][];
  layers: readonly [string, string, string];
}> = {
  "web-design-sydney": {
    steps: [["Understand the audience", "Clarify the offer, existing content and the decisions visitors need to make."], ["Structure the experience", "Map pages, navigation and enquiry paths before refining the visual direction."], ["Develop responsively", "Build the interface across screen sizes with accessible interactions and search foundations."], ["Check and launch", "Review content, navigation and forms together before publishing."]],
    layers: ["Content & navigation", "Responsive interface", "Enquiry journey"],
  },
  "ecommerce-website-development": {
    steps: [["Map the catalogue", "Understand products, collections, stock information and the way customers buy."], ["Design product discovery", "Shape filtering, product information and mobile browsing around that catalogue."], ["Connect the purchase path", "Scope cart, checkout, payment and quote requirements around operational needs."], ["Review the full journey", "Check browsing, ordering and customer information before launch."]],
    layers: ["Product catalogue", "Cart & quote journey", "Order requirements"],
  },
  "seo-local-visibility": {
    steps: [["Inspect the foundations", "Review architecture, page intent, schema and technical search signals."], ["Prioritise the findings", "Create a practical plan based on the evidence and business priorities."], ["Improve the pages", "Refine content structure, on-page signals and local search clarity."], ["Review the evidence", "Use available measurement to choose the next useful improvement."]],
    layers: ["Page intent", "Technical structure", "Local relevance"],
  },
  "branding-content": {
    steps: [["Clarify the positioning", "Understand the audience, offer and existing brand materials."], ["Define the direction", "Align visual identity and message hierarchy with the business."], ["Create the content", "Apply the direction to website words and relevant creative touchpoints."], ["Check consistency", "Review the complete experience for a coherent visual and verbal system."]],
    layers: ["Business positioning", "Visual direction", "Website messaging"],
  },
  "digital-marketing": {
    steps: [["Define the campaign goal", "Agree the audience, offer and action the campaign should support."], ["Connect the journey", "Align creative and landing-page content with that action."], ["Build the destination", "Create the lead-generation path and scope measurement foundations."], ["Review and refine", "Use available evidence to improve the content and customer journey."]],
    layers: ["Audience & offer", "Landing experience", "Enquiry & measurement"],
  },
  "website-maintenance": {
    steps: [["Review the existing site", "Understand the current framework, content and operational dependencies."], ["Agree priorities", "Define support scope, response expectations and the most useful improvements."], ["Make focused changes", "Deliver updates, technical care and performance improvements with review points."], ["Validate the result", "Check affected journeys and agree the next maintenance priorities."]],
    layers: ["Existing website", "Focused improvements", "Technical checks"],
  },
  "custom-software-business-systems": {
    steps: [["Map the operational workflow", "Audit current spreadsheets, bottlenecks, staff roles and data handoffs before writing code."], ["Architect the data & permissions", "Design clean PostgreSQL schemas, role-based authentication and audit trails around your business rules."], ["Engineer the interface", "Build a fast, responsive web application optimised for desktop dispatchers and mobile field staff alike."], ["Deploy, train & iterate", "Launch with production backups, onboard your team smoothly and expand features as operations scale."]],
    layers: ["Operational workflow", "Role-based access & data", "Reporting & automation"],
  },
};
