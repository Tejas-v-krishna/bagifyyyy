import { ImageResponse } from "next/og";

export const alt =
  "BAGIFYYYY (Bagify) — Premium Y2K Streetwear, Archive Fashion & Limited Drops";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ICE = "#EAF1F6";
const GUNMETAL = "#24374C";
const SLATE = "#6B8BA5";
const DEEP = "#405E78";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: ICE,
          backgroundImage: `radial-gradient(circle at 85% 20%, ${DEEP}11 0%, transparent 45%), radial-gradient(circle at 15% 85%, ${SLATE}22 0%, transparent 40%)`,
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
          color: GUNMETAL,
          position: "relative",
        }}
      >
        {/* Top meta row */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: `${GUNMETAL}aa`,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: GUNMETAL,
              }}
            />
            <span>SS26 Archive</span>
         </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <span>Y2K Streetwear</span>
            <span style={{ color: `${GUNMETAL}55` }}>·</span>
            <span>No Restocks</span>
            <span style={{ color: `${GUNMETAL}55` }}>·</span>
            <span>1 of 1</span>
         </div>
       </div>

        {/* Main wordmark + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 168,
              fontWeight: 700,
              letterSpacing: -8,
              lineHeight: 0.86,
              textTransform: "uppercase",
              color: GUNMETAL,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ display: "flex" }}>BAGIFYYYY</span>
            <span
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 500,
                letterSpacing: -3,
                color: SLATE,
                marginTop: 18,
              }}
            >
              Archive. Wear History.
           </span>
         </div>
       </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: `${GUNMETAL}cc`,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: `${GUNMETAL}66`, fontSize: 16 }}>Shop the drop</span>
            <span style={{ fontWeight: 700 }}>bagifyyyy.in</span>
         </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              border: `1.5px solid ${GUNMETAL}`,
              color: GUNMETAL,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 4,
            }}
          >
            <span>Curated 1-of-1 Vintage</span>
            <span style={{ fontSize: 26 }}>*</span>
         </div>
       </div>
     </div>
    ),
    size
  );
}
