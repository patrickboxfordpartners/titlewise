"use client";

import { useState } from "react";

export function DownloadButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href="/api/resources/pdf?slug=ai-native-closing"
      download
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: isHovered ? "#4434d4" : "var(--primary)",
        color: "#ffffff",
        fontSize: "1rem",
        fontWeight: 400,
        padding: "12px 20px",
        borderRadius: 9999,
        textDecoration: "none",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 10.5L4.5 7L5.55 5.9L7.25 7.6V1H8.75V7.6L10.45 5.9L11.5 7L8 10.5ZM3.5 15C3.0875 15 2.73438 14.8531 2.44063 14.5594C2.14688 14.2656 2 13.9125 2 13.5V10.5H3.5V13.5H12.5V10.5H14V13.5C14 13.9125 13.8531 14.2656 13.5594 14.5594C13.2656 14.8531 12.9125 15 12.5 15H3.5Z"
          fill="currentColor"
        />
      </svg>
      Download PDF
    </a>
  );
}
