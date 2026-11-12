import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon } from "../icons";
import { ExplodedLayers } from "./home/sections/ExplodedLayers";
import { layerArt } from "./home/sections/layer-art";

const capabilities = [
  { number: "01", title: "Premium websites", copy: "Distinctive design, clear messaging and a considered path from first impression to enquiry.", href: "/services/web-design-sydney", symbol: "website" },
  { number: "02", title: "Web development", copy: "Responsive web applications and digital products built around the way your business works.", href: "/work", symbol: "code" },
  { number: "03", title: "Business systems", copy: "Inventory, purchasing, sales and invoicing workflows brought together in practical custom software.", href: "/services/custom-software-business-systems", symbol: "system" },
  { number: "04", title: "AI + automation", copy: "Explore where AI and connected workflows can remove repetitive work from your business.", href: "/contact", symbol: "automation" },
] as const;

/**
 * Capabilities as an exploded view: four translucent layers in CSS 3D that fan
 * apart in depth as you move over the stage or its rows. Below 900px the stage
 * is dropped and the rows stand alone as a plain vertical list.
 */
export function StudioCapabilities() {
  return (
    <section className="sx-cap" id="services" aria-labelledby="services-heading">
      <div className="sx-cap-inner">
        <ExplodedLayers>
          <div className="sx-cap-head">
            <p className="ix-label">02 · Capabilities</p>
            <h2 id="services-heading">From first impression to <em>everyday operation.</em></h2>
            <p>From the first strategic decision to post-launch support, every recommendation is tied to a clear business goal.</p>
          </div>

          <ol className="sx-layers">
            {capabilities.map((capability, index) => (
              <li key={capability.number} data-layer={index}>
                <Link href={capability.href} prefetch={false}>
                  <span className="sx-layer-n">{capability.number}</span>
                  <div className="sx-layer-body">
                    <h3>{capability.title}</h3>
                    <p className="sx-layer-copy">{capability.copy}</p>
                    <span className="sx-layer-link">{capability.symbol === "automation" ? "Discuss your idea" : "Explore the work"}<ArrowIcon /></span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>

          <div className="sx-explode-stage" data-stage aria-hidden="true">
            <div className="sx-rig">
              {capabilities.map((capability, index) => (
                <div className="sx-slab" key={capability.number} data-layer={index} style={{ "--i": index } as CSSProperties}>
                  {layerArt[index]}
                  <span className="sx-slab-no">{capability.number}</span>
                </div>
              ))}
            </div>
            <p className="sx-stage-cap">Fig. 02 <i /> Exploded view <i /> 4 layers</p>
          </div>
        </ExplodedLayers>
      </div>
    </section>
  );
}
