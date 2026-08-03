import { ImageResponse } from "next/og";

export const alt = "AB Digital Solutions — premium websites built for online success";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "74px 86px", color: "#f8f4ea", background: "radial-gradient(circle at 82% 18%, #5a3c08 0%, #0a0907 42%, #030303 100%)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ color: "#d8aa43", fontSize: 34, letterSpacing: 5 }}>AB DIGITAL SOLUTIONS</div>
      <div style={{ width: 110, height: 4, margin: "34px 0", background: "#d8aa43" }} />
      <div style={{ maxWidth: 980, fontSize: 78, fontWeight: 700, lineHeight: 1.02 }}>Websites built to earn attention and create action.</div>
      <div style={{ marginTop: 38, color: "#d8d2c4", fontSize: 28 }}>Sydney studio · Australia-wide</div>
    </div>,
    size,
  );
}
