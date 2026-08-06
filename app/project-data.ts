import { assetBase } from "./site-config";

export type Project = {
  name: string;
  category: string;
  description: string;
  url: string;
  displayUrl: string;
  image: string;
  alt: string;
};

export const projects = [
  {
    name: "Maple Rentals",
    category: "Mobility / Car rentals",
    description: "Premium driver rentals and streamlined online applications.",
    url: "https://www.maplerentals.com.au/",
    displayUrl: "maplerentals.com.au",
    image: `${assetBase}/ab-portfolio-maple-rentals.jpg`,
    alt: "Maple Rentals website homepage preview",
  },
  {
    name: "Gala Rentals",
    category: "Mobility / Car rentals",
    description: "A confident booking experience for weekly car rentals in Sydney.",
    url: "https://www.galarentals.com.au/",
    displayUrl: "galarentals.com.au",
    image: `${assetBase}/ab-portfolio-gala-rentals.jpg`,
    alt: "Gala Rentals website homepage preview",
  },
  {
    name: "ZQ Removals",
    category: "Services / Removals",
    description: "Local-service positioning and a direct path to quote requests.",
    url: "https://zqremovals.au/",
    displayUrl: "zqremovals.au",
    image: `${assetBase}/ab-portfolio-zq-removals.jpg`,
    alt: "ZQ Removals website homepage preview",
  },
  {
    name: "DECENT Development",
    category: "Property / Development",
    description: "A refined digital presence for a Sydney construction business.",
    url: "https://www.decentdevelopment.com.au/",
    displayUrl: "decentdevelopment.com.au",
    image: `${assetBase}/ab-portfolio-decent-development.jpg`,
    alt: "DECENT Development website homepage preview",
  },
  {
    name: "Milestone Development",
    category: "Property / Construction",
    description: "A project-led showcase for residential and commercial construction.",
    url: "https://milestonedevelopment.com.au/",
    displayUrl: "milestonedevelopment.com.au",
    image: `${assetBase}/ab-portfolio-milestone-development.jpg`,
    alt: "Milestone Development website homepage preview",
  },
  {
    name: "4 Point Concrete",
    category: "Construction / Civil",
    description: "Capability-focused presentation for concrete and structural works.",
    url: "https://4-point-concrete-design.vercel.app/",
    displayUrl: "4-point-concrete-design.vercel.app",
    image: `${assetBase}/ab-portfolio-four-point-concrete.jpg`,
    alt: "4 Point Concrete website homepage preview",
  },
  {
    name: "1st Class Express",
    category: "Transport & Logistics Website",
    description:
      "Interstate freight positioning, a clear fleet showcase and a fast path to quote enquiries on every screen size.",
    url: "https://www.1stclassexpress.com.au/",
    displayUrl: "1stclassexpress.com.au",
    image: `${assetBase}/ab-portfolio-1st-class-express.jpg`,
    alt: "1st Class Express transport and logistics website homepage preview",
  },
] as const satisfies readonly Project[];
