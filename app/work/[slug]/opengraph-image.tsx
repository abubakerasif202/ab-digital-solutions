import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findProject, isSoftwareProject } from "../../project-data";
import { readOpenGraphPalette } from "../../og-palette";

export const alt = "AB Web Studio client case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { primary, deep }, artwork] = await Promise.all([
    params,
    readOpenGraphPalette(),
    readFile(join(process.cwd(), "public/brand/ab-logo-luxury-social.png")),
  ]);
  const artworkUrl = `data:image/png;base64,${artwork.toString("base64")}`;
  const project = findProject(slug);
  const name = project?.name ?? "Client work";
  const detail = project
    ? `${project.category} · ${isSoftwareProject(project) ? "Custom software" : "Website"} case study`
    : "Case study";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: "28px",
        background: `radial-gradient(circle at 84% 18%, ${deep} 0%, #14090c 38%, #070708 82%)`,
        color: "#f4f1ea",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Matches the root OG image's carbon, metallic gold and ruby palette. */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 62px",
          border: "1px solid rgba(201, 164, 92, 0.34)",
          background: "linear-gradient(145deg, rgba(16, 15, 14, 0.72) 0%, rgba(7, 7, 8, 0.92) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="102" height="81" viewBox="0 0 260 206">
              <image href={artworkUrl} width="260" height="206" />
            </svg>
            <div style={{ color: "#F4F1EA", fontSize: 24, fontWeight: 600, letterSpacing: 5 }}>AB WEB STUDIO</div>
          </div>
          <div style={{ color: "#C9A45C", fontSize: 18, letterSpacing: 4 }}>CASE STUDY</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <div style={{ width: 76, height: 4, background: primary }} />
            <div style={{ width: 38, height: 2, background: "#C9A45C" }} />
          </div>
          <div style={{ maxWidth: 980, fontSize: 68, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.2, color: "#f8f4ea" }}>
            {name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: 22,
            borderTop: "1px solid rgba(201, 164, 92, 0.24)",
            color: "#d8d2c4",
            fontSize: 24,
          }}
        >
          <div>{detail}</div>
          <div style={{ color: "#C9A45C", fontSize: 22, letterSpacing: 1 }}>abwebstudio.com.au</div>
        </div>
      </div>
    </div>,
    size,
  );
}
