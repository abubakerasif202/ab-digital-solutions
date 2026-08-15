import { ImageResponse } from "next/og";
import { findProject, projects } from "../../project-data";
import { siteConfig } from "../../site-config";

export const alt = "AB Digital Solutions website case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

/**
 * Per-case-study social card.
 *
 * Every value comes from `project-data.ts` (the same source the page renders),
 * so a shared card can never claim something the case study does not say.
 */
export default async function CaseStudyOpenGraphImage({ params }: Props) {
  const project = findProject((await params).slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 82px",
          color: "#f8f4ea",
          background: "radial-gradient(circle at 84% 16%, #5a3c08 0%, #0a0907 44%, #030303 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#d8aa43", fontSize: 30, letterSpacing: 5 }}>
            AB DIGITAL SOLUTIONS
          </div>
          <div style={{ width: 104, height: 4, margin: "30px 0", background: "#b5121b" }} />
          <div style={{ color: "#d8d2c4", fontSize: 27 }}>
            {project ? `Case study · ${project.category}` : "Website case study"}
          </div>
          <div style={{ maxWidth: 1000, marginTop: 18, fontSize: 72, fontWeight: 700, lineHeight: 1.04 }}>
            {project ? project.name : "Selected work"}
          </div>
          <div style={{ maxWidth: 940, marginTop: 22, color: "#cfc9bb", fontSize: 30, lineHeight: 1.32 }}>
            {project ? project.description : "Live websites built for Australian businesses."}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#9b958a", fontSize: 24 }}>
          <span>{project ? project.displayUrl : siteConfig.url.replace("https://", "")}</span>
          <span>Sydney studio · Australia-wide</span>
        </div>
      </div>
    ),
    size,
  );
}
