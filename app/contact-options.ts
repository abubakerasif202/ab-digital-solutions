export const contactServices = [
  "Website design & development",
  "SEO & local visibility",
  "Branding & content",
  "E-commerce solutions",
  "Digital marketing",
  "Website care & support",
  "Custom software & business systems",
] as const;

/** Short keys and canonical service slugs accepted by the preselected enquiry form. */
export const contactServiceKeys = {
  "web-design": "Website design & development",
  seo: "SEO & local visibility",
  branding: "Branding & content",
  ecommerce: "E-commerce solutions",
  marketing: "Digital marketing",
  maintenance: "Website care & support",
  "custom-software": "Custom software & business systems",
  "web-design-sydney": "Website design & development",
  "seo-local-visibility": "SEO & local visibility",
  "branding-content": "Branding & content",
  "ecommerce-website-development": "E-commerce solutions",
  "digital-marketing": "Digital marketing",
  "website-maintenance": "Website care & support",
  "custom-software-business-systems": "Custom software & business systems",
} as const satisfies Record<string, (typeof contactServices)[number]>;

export const UNSURE_SERVICE = "Not sure yet";

export type ContactServiceKey = keyof typeof contactServiceKeys;

export const BUDGET_OPTIONS = [
  "$2,000–$4,000",
  "$4,000–$8,000",
  "$8,000–$15,000",
  "$15,000+",
  "Not sure yet",
] as const;

/** Services whose scope typically starts above the lowest budget bracket. */
export const contactScopedServices: readonly string[] = [
  "Custom software & business systems",
  "E-commerce solutions",
];

export const contactScopeNote =
  "Note: Custom business software, inventory platforms and e-commerce builds typically scope from $4,000+ depending on integrations.";
