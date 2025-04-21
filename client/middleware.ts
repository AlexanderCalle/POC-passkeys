
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/session";

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/recover', '/recover/verify', '/recover/passkey'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // Get current path
    const path = request.nextUrl.pathname;
    
    // Get session
    const session = await getSession();

     // Redirect unauthenticated users to login
     if (!session) {
      const loginUrl = new URL("/login", request.url);
      if (PUBLIC_PATHS.includes(path)) {
        return response;
      }
      loginUrl.searchParams.set("from", path);
      return NextResponse.redirect(loginUrl);
    }

    
    const verifyResponse = await fetch("http://localhost:3001/api/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.value}`,
      },
      credentials: "include",
    });

    console.log("verifyResponse", verifyResponse);

     // Redirect authenticated users away from public paths
     if (verifyResponse.ok && PUBLIC_PATHS.includes(path)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }


    // Allow access to public paths without authentication
    if (PUBLIC_PATHS.includes(path)) {
      return response;
    }

    // Handle invalid/expired token
    if (!verifyResponse.ok) {
      // Clear session here if needed
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    return response;

  } catch (error) {
    console.error("Middleware error:", error);
    // In case of any error, redirect to login with error message
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "internal_error");
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
