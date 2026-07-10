import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, Car, Users, Calendar, Shield, Mail } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — RentalSphere" }] }),
  beforeLoad: requireAdmin,
  component: AdminLayout,
});

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3, path: "/admin/overview" },
  { id: "vehicles", label: "Vehicles", icon: Car, path: "/admin/vehicles" },
  { id: "bookings", label: "Bookings", icon: Calendar, path: "/admin/bookings" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "queries", label: "Queries", icon: Mail, path: "/admin/queries" },
] as const;

function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">You don't have permission to view this page.</p>
          <Link
            to="/"
            className="mt-4 inline-flex h-11 px-6 items-center rounded-full gradient-brand text-white text-sm"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface/50">
      <div className="container-page py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-[var(--shadow-glow)]">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
                Admin Console
              </h1>
              <p className="text-xs text-muted-foreground">Manage fleet, bookings, and customers</p>
            </div>
          </div>
          <Link
            to="/"
            className="hidden md:inline-flex h-10 px-4 items-center rounded-full text-sm border border-border hover:bg-muted"
          >
            View site
          </Link>
        </div>

        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = location.pathname.startsWith(t.path);
            return (
              <Link
                key={t.id}
                to={t.path}
                className={cn(
                  "relative px-4 py-3 inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "text-primary" : "text-foreground/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {active && (
                  <motion.span
                    layoutId="admin-tab"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="pt-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
