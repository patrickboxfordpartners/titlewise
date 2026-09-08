"use client";

import Link from "next/link";
import { useState } from "react";

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        marginTop: 64,
        padding: "48px 40px",
        backgroundColor: "#f5e9d4",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginBottom: 16,
        }}
      >
        Ready to transform your closing workflow?
      </h2>
      <p
        style={{
          fontSize: "1rem",
          fontWeight: 300,
          color: "var(--foreground)",
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: 560,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        TitleWise brings AI-native document intelligence to title attorneys. Request early access to
        see how agent-native workflows can handle your pattern work.
      </p>
      <Link
        href="/early-access"
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: isHovered ? "#4434d4" : "var(--primary)",
          color: "#ffffff",
          fontSize: "1rem",
          fontWeight: 400,
          padding: "12px 24px",
          borderRadius: 9999,
          textDecoration: "none",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Request Early Access
      </Link>
    </div>
  );
}
