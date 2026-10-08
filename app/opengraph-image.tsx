import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "AB Web Studio — websites, systems and digital products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const artwork = await readFile(join(process.cwd(), "public/brand/ab-logo-luxury-social.png"));
  const artworkUrl = `data:image/png;base64,${artwork.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "74px 86px", color: "#e9e9e2", background: "#101114", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <svg width="144" height="114" viewBox="0 0 260 206">
          <image href={artworkUrl} width="260" height="206" />
        </svg>
        <div style={{ color: "#F4F1EA", fontSize: 30, letterSpacing: 5 }}>AB WEB STUDIO</div>
      </div>
      <div style={{ width: 110, height: 4, margin: "34px 0", background: "#3157ff" }} />
      <div style={{ maxWidth: 980, fontSize: 78, fontWeight: 700, lineHeight: 1.02 }}>Digital experiences that do the selling.</div>
      <div style={{ marginTop: 38, color: "#c1c2c5", fontSize: 28 }}>Sydney studio · Australia-wide</div>
    </div>,
    size,
  );
}
