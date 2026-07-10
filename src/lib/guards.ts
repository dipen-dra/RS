/**
 * Route guards for TanStack Router.
 * Use in route `beforeLoad` to protect pages.
 */
import { redirect } from "@tanstack/react-router";
import { getMe } from "./api";

/** Requires the user to be logged in. Redirects to /login if not. */
export async function requireAuth({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return { user: null }; // Bypass on server
  try {
    const res = await getMe();
    return { user: res.user };
  } catch {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/** Requires the user to be an admin. Redirects to / if not. */
export async function requireAdmin({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return { user: null }; // Bypass on server
  try {
    const res = await getMe();
    if (res.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: res.user };
  } catch (err) {
    // If it's a redirect thrown above, re-throw it
    if ((err as { isRedirect?: boolean }).isRedirect) throw err;
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/** Redirect logged-in users away from login/signup pages. */
export async function redirectIfLoggedIn() {
  if (typeof window === "undefined") return; // Bypass on server
  try {
    const res = await getMe();
    if (res.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
    throw redirect({ to: "/dashboard" });
  } catch (err) {
    if ((err as { isRedirect?: boolean }).isRedirect) throw err;
    // Not logged in — allow access to the page
  }
}
