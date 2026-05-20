import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#131419",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          color: "#C8F049",
          fontSize: 52,
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "-0.06em",
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        c
      </div>
    ),
    { ...size },
  );
}
