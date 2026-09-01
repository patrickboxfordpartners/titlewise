import { ImageResponse } from "next/og"

export const alt = "TITLEwise - AI Closing Platform for Real Estate Attorneys"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle accent gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            display: "flex",
            background: "linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6)",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-2px",
            display: "flex",
            marginBottom: "16px",
          }}
        >
          TITLEwise
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#94a3b8",
            display: "flex",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          AI Closing Platform for Real Estate Attorneys
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            display: "flex",
            width: "80px",
            height: "3px",
            background: "#3b82f6",
            borderRadius: "2px",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
