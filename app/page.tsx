import { IntroReveal } from "./components/IntroReveal";
import AgencyHome from "./agency-home";

export default function Home() {
  return (
    <>
      <IntroReveal />
      <AgencyHome currentYear={new Date().getUTCFullYear()} />
    </>
  );
}
