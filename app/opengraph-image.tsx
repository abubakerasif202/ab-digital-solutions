import { ImageResponse } from "next/og";

export const alt = "AB Web Studio — websites, systems and digital products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "74px 86px", color: "#f8f4ea", background: "#070708", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <svg width="92" height="74" viewBox="0 0 80 64" fill="none">
          <path d="M4 52 19 12h8l15 40h-9l-3-9H15l-3 9H4Zm14-17h9l-4.5-13L18 35Z" fill="#F4F1EA" />
          <path d="M44 12h14c9 0 14 4 14 11 0 4-2 7-5 9 4 2 6 5 6 9 0 7-5 11-15 11H44V12Zm8 8v9h6c4 0 6-2 6-5s-2-4-6-4h-6Zm0 17v7h6c5 0 7-1 7-4s-2-3-7-3h-6Z" fill="#F4F1EA" />
          <path d="M34 54 47 10h4L38 54Z" fill="#D21736" />
        </svg>
        <div style={{ color: "#F4F1EA", fontSize: 30, letterSpacing: 5 }}>AB WEB STUDIO</div>
      </div>
      <div style={{ width: 110, height: 4, margin: "34px 0", background: "#D21736" }} />
      <div style={{ maxWidth: 980, fontSize: 78, fontWeight: 700, lineHeight: 1.02 }}>Digital experiences that do the selling.</div>
      <div style={{ marginTop: 38, color: "#d8d2c4", fontSize: 28 }}>Sydney studio · Australia-wide</div>
    </div>,
    size,
  );
}
