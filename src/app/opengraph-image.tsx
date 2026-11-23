import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "POOJAVI THE LABEL — Wear a Story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [serif, sans] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/cormorant-garamond-latin-500-normal.woff")),
    readFile(join(process.cwd(), "src/assets/jost-latin-400-normal.woff")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#551F32", color: "#F8F5EF" }}>
        <div style={{ position: "absolute", inset: 28, border: "1px solid rgba(214,194,161,0.55)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "Cormorant", fontSize: 128, letterSpacing: "0.3em", marginRight: "-0.3em", lineHeight: 1 }}>POOJAVI</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <div style={{ width: 70, height: 1, background: "#D6C2A1" }} />
            <div style={{ fontFamily: "Jost", fontSize: 26, letterSpacing: "0.6em", margin: "0 18px 0 30px", color: "#D6C2A1" }}>THE LABEL</div>
            <div style={{ width: 70, height: 1, background: "#D6C2A1" }} />
          </div>
          <div style={{ fontFamily: "Cormorant", fontSize: 34, letterSpacing: "0.24em", marginTop: 56, opacity: 0.85 }}>WEAR A STORY</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: serif, style: "normal", weight: 500 },
        { name: "Jost", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
