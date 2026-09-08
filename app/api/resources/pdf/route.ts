import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";

const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  if (!BROWSER_WS_ENDPOINT) {
    return NextResponse.json(
      { error: "BROWSER_WS_ENDPOINT not configured" },
      { status: 500 }
    );
  }

  // Map slugs to page URLs and titles
  const resourceMap: Record<string, { url: string; title: string; filename: string }> = {
    "ai-native-closing": {
      url: `${request.nextUrl.origin}/resources/ai-native-closing`,
      title: "The AI-Native Closing",
      filename: "titlewise-ai-native-closing.pdf",
    },
  };

  const resource = resourceMap[slug];
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  let browser;
  try {
    // Connect to Browserless
    browser = await chromium.connect(BROWSER_WS_ENDPOINT);
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: "TitleWise-PDF-Generator/1.0",
    });

    const page = await context.newPage();

    // Navigate to the resource page
    await page.goto(resource.url, { waitUntil: "networkidle" });

    // Inject CSS to hide nav and footer for PDF
    await page.addStyleTag({
      content: `
        nav, footer, .no-print {
          display: none !important;
        }
        body {
          padding-top: 0 !important;
        }
        /* Improve print layout */
        article {
          max-width: 100% !important;
        }
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        p, li {
          page-break-inside: avoid;
        }
        svg {
          page-break-inside: avoid;
        }
      `,
    });

    // Inject cover page
    await page.evaluate((title: string) => {
      const coverPage = document.createElement("div");
      coverPage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: linear-gradient(135deg, #533afd 0%, #665efd 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        z-index: 9999;
      `;

      coverPage.innerHTML = `
        <div style="text-align: center; color: white;">
          <h1 style="font-size: 3rem; font-weight: 300; letter-spacing: -1.4px; margin-bottom: 24px; color: white;">${title}</h1>
          <p style="font-size: 1.25rem; font-weight: 300; margin-bottom: 48px; color: rgba(255,255,255,0.9);">TitleWise Research</p>
          <div style="margin-top: 80px;">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="60" y="28" text-anchor="middle" fill="white" font-size="24" font-weight="300" font-family="system-ui">TitleWise</text>
            </svg>
          </div>
        </div>
      `;

      document.body.insertBefore(coverPage, document.body.firstChild);
    }, resource.title);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.75in",
        right: "0.75in",
        bottom: "0.75in",
        left: "0.75in",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 10px; font-family: system-ui; color: #64748d; text-align: right; padding: 0 0.75in;">
          <span style="margin-right: 10px;">${resource.title}</span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; font-family: system-ui; color: #64748d; display: flex; justify-content: space-between; padding: 0 0.75in;">
          <span>© 2026 TitleWise</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    await context.close();

    // Return PDF as download
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resource.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
