import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://titlewise.app${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        style={{
          fontSize: "0.8125rem",
          fontWeight: 300,
          color: "#64748d",
          padding: "16px 0 0",
        }}
      >
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {items.map((item, i) => (
            <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && (
                <span aria-hidden="true" style={{ color: "#e3e8ee" }}>/</span>
              )}
              {item.href && i < items.length - 1 ? (
                <Link
                  href={item.href}
                  style={{
                    color: "#64748d",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={i === items.length - 1 ? "page" : undefined}
                  style={{ color: "#0d253d" }}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
