/**
 * Route guards for TanStack Router.
 * Use in route `beforeLoad` to protect pages.
 *
 * Role hierarchy:
 *  user       — can browse, book, manage own profile
 *  admin      — can manage bookings, vehicles, view/respond to queries
 *  superadmin — all admin powers + security logs, user role management, IP blocking
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

/** Requires admin role. Redirects superadmin to /superadmin, others to / if not. */
export async function requireAdmin({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return { user: null };
  try {
    const res = await getMe();
    if (res.user.role === "superadmin") {
      throw redirect({ to: "/superadmin" });
    }
    if (res.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: res.user };
  } catch (err) {
    if ((err as { isRedirect?: boolean }).isRedirect) throw err;
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/** Requires superadmin role. Redirects admin to /admin, others to / if not. */
export async function requireSuperAdmin({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return { user: null };
  try {
    const res = await getMe();
    if (res.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
    if (res.user.role !== "superadmin") {
      throw redirect({ to: "/" });
    }
    return { user: res.user };
  } catch (err) {
    if ((err as { isRedirect?: boolean }).isRedirect) throw err;
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/** Redirect logged-in users away from login/signup pages. */
export async function redirectIfLoggedIn() {
  if (typeof window === "undefined") return;
  try {
    const res = await getMe();
    if (res.user.role === "superadmin") {
      throw redirect({ to: "/superadmin" });
    }
    if (res.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
    throw redirect({ to: "/dashboard" });
  } catch (err) {
    if ((err as { isRedirect?: boolean }).isRedirect) throw err;
    // Not logged in — allow access to the page
  }
}
