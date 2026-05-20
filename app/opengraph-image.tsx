import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "code.davidloor.com — interview problems in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(180deg, #131419 0%, #0C0D11 100%)",
          color: "#ECE7D8",
          display: "flex",
          flexDirection: "column",
          padding: "72px 88px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* top strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: "#7A7565",
            fontSize: 16,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <span>code.davidloor.com</span>
          <span>Vol. I — 2026</span>
        </div>

        {/* center mass */}
        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#ECE7D8",
              fontWeight: 400,
            }}
          >
            Read the problem.
          </div>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#ECE7D8",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Write the answer.
          </div>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#C8F049",
              fontWeight: 400,
            }}
          >
            Run it.
          </div>
        </div>

        {/* footer strip */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: "#7A7565",
            fontSize: 18,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontFamily: "Arial, sans-serif",
            borderTop: "1px solid #2C2F3A",
            paddingTop: 18,
          }}
        >
          <span>20 problems · Python &amp; JavaScript</span>
          <span style={{ color: "#C8F049" }}>Open source · MIT</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
