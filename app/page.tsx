import AgencyHome from "./agency-home";

export default function Home() {
  return <AgencyHome currentYear={new Date().getUTCFullYear()} />;
}
