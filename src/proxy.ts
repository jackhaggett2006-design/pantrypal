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
     * Match all request paths except static assets and image files:
     * - _next/static, _next/image
     * - favicon.ico, and common image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
