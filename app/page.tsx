import "./styles/cinematic.css";
import "./styles/ruby-cinematic.css";
import "./styles/project-exhibition.css";
import "./styles/ruby-kinetic.css";
import "./styles/ruby-mobile-motion.css";
import "./styles/homepage-refinement.css";
import type { Metadata } from "next";
import AgencyHome from "./agency-home";

// Canonical lives on each page, not the root layout, so error and 404 pages never inherit the home page's canonical.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <AgencyHome currentYear={new Date().getUTCFullYear()} />;
}
