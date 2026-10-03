import Link from "next/link";
import { ArrowIcon } from "../icons";

const capabilities = [
  { number: "01", title: "Premium websites", copy: "Distinctive design, clear messaging and a considered path from first impression to enquiry.", href: "/services/web-design-sydney", symbol: "website" },
  { number: "02", title: "Web development", copy: "Responsive web applications and digital products built around the way your business works.", href: "/work", symbol: "code" },
  { number: "03", title: "Business systems", copy: "Inventory, purchasing, sales and invoicing workflows brought together in practical custom software.", href: "/work/247-inventory-system", symbol: "system" },
  { number: "04", title: "AI + automation", copy: "Explore where AI and connected workflows can remove repetitive work from your business.", href: "/#contact", symbol: "automation" },
] as const;

export function StudioCapabilities() {
  return (
    <div className="studio-capabilities">
      {capabilities.map((capability) => (
        <Link key={capability.number} href={capability.href} className="capability-card glow-surface" data-tilt data-reveal>
          <div className="capability-top"><span>{capability.number}</span><span className={`capability-symbol capability-symbol-${capability.symbol}`} aria-hidden="true"><i /><i /><i /></span></div>
          <h3>{capability.title}</h3>
          <p>{capability.copy}</p>
          <span className="capability-link">{capability.symbol === "automation" ? "Discuss your idea" : "Explore the work"}<ArrowIcon /></span>
        </Link>
      ))}
    </div>
  );
}
