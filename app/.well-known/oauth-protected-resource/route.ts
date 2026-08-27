import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const metadata = {
    resource: "https://titlewise.app/api",
    authorization_servers: ["https://clerk.titlewise.app"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://titlewise.app/api-docs",
    resource_signing_alg_values_supported: ["RS256", "ES256"],
    agent_auth: {
      register_uri: "https://titlewise.app/auth.md#register",
      identity_types_supported: ["identity_assertion", "anonymous"],
      anonymous: {
        credential_types_supported: ["bearer-token"],
      },
      identity_assertion: {
        assertion_types_supported: [
          "urn:ietf:params:oauth:token-type:id-jag",
          "verified_email",
        ],
        credential_types_supported: ["bearer-token", "oauth2-client-credentials"],
      },
      skill: "https://titlewise.app/auth.md",
    },
  }

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
