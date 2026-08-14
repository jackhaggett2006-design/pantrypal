import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy (formerly Middleware). Runs before requests to keep the
 * Supabase auth session fresh and redirect unauthenticated users to /login.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and PWA files:
     * - _next/static, _next/image
     * - favicon.ico, the web manifest, and common image extensions
     * These must stay reachable without a session (installability checks,
     * home-screen icon fetches happen before/without auth).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
