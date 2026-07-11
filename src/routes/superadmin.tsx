import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, Users, ShieldAlert, Crown, Home } from "lucide-react";
import { requireSuperAdmin } from "@/lib/guards";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  head: () => ({ meta: [{ title: "Super Admin — RentalSphere" }] }),
  beforeLoad: requireSuperAdmin,
  component: SuperAdminLayout,
});

const tabs = [
  { id: "overview",      label: "Overview",       icon: BarChart3,   path: "/superadmin/overview" },
  { id: "users",         label: "User Management",icon: Users,        path: "/superadmin/users" },
  { id: "security-logs", label: "Security Logs",  icon: ShieldAlert,  path: "/superadmin/security-logs" },
] as const;

function SuperAdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-12 w-12 mx-auto text-amber-500/50 mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink">Super Admin access required</h1>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
                Super Admin Console
              </h1>
              <p className="text-xs text-muted-foreground">
                Full system control — security, users, audit logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden md:inline-flex h-10 px-4 items-center gap-2 rounded-full text-sm border border-border hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" /> View site
            </Link>
          </div>
        </div>

        {/* Tabs */}
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
                  active ? "text-amber-500" : "text-foreground/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {active && (
                  <motion.span
                    layoutId="superadmin-tab"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-amber-500"
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
