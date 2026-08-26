export interface ICTokenPayload {
  sub: string;
  scopes: string[];
  exp: number;
  iat: number;
}

export type AuthResult =
  | { success: true; agentId: string; scopes: string[] }
  | { success: false; error: string; status: number }

export async function verifyICToken(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { success: false, error: "Missing Authorization header", status: 401 };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return { success: false, error: "Invalid Authorization format. Use: Bearer <ic_token>", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token.startsWith("agt_") && !token.startsWith("ic_")) {
    return { success: false, error: "Invalid token format. Expected IC agent token.", status: 401 };
  }

  // Validate token against IC's verification endpoint
  const verifyResponse = await fetch("https://www.immersivecommons.com/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!verifyResponse.ok) {
    return { success: false, error: "Token verification failed", status: 401 };
  }

  const payload: ICTokenPayload = await verifyResponse.json();

  // Check required scopes
  const hasScope = payload.scopes.some(s =>
    s === "titlewise:analyze" || s === "titlewise:read" || s.startsWith("hack:")
  );

  if (!hasScope) {
    return {
      success: false,
      error: "Insufficient scopes. Required: titlewise:analyze or titlewise:read",
      status: 403,
    };
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { success: false, error: "Token expired", status: 401 };
  }

  return {
    success: true,
    agentId: payload.sub,
    scopes: payload.scopes,
  };
}

export function requireScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("titlewise:*") || scopes.some(s => s.startsWith("hack:"));
}
