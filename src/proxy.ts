import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Everything is private. Only the login page and the login endpoint are
// reachable without a valid session cookie.
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/diag", // temporary setup diagnostic; remove with the route
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const secret = process.env.AUTH_SECRET;
  const username = await verifySession(
    req.cookies.get(SESSION_COOKIE)?.value,
    secret ?? ""
  );
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Signed in already: skip the login page.
  if (username && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isPublic || username) return NextResponse.next();

  // API calls get a status, not a redirect, so fetches fail cleanly.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
