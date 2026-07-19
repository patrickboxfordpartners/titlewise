"use client"

interface Props {
  categories: string[]
}

export default function FAQCategoryNav({ categories }: Props) {
  return (
    <div style={{
      borderBottom: "1px solid var(--border)",
      backgroundColor: "var(--background)",
      position: "sticky",
      top: 64,
      zIndex: 40,
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px", display: "flex", gap: 4, overflowX: "auto" }}>
        {categories.map((cat) => (
          <a
            key={cat}
            href={`#${cat.toLowerCase().replace(/\s+&?\s*/g, "-")}`}
            style={{
              display: "inline-block",
              padding: "14px 16px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)"
              ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "var(--primary)"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted-foreground)"
              ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "transparent"
            }}
          >
            {cat}
          </a>
        ))}
      </div>
    </div>
  )
}
