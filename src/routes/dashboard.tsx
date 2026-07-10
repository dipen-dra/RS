import { createFileRoute, Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Car, Calendar, User, LogOut, Mail } from "lucide-react";
import { requireAuth } from "@/lib/guards";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — RentalSphere" }] }),
  beforeLoad: requireAuth,
  component: DashboardLayout,
});

const tabs = [
  { id: "overview", label: "Overview", icon: Car, path: "/dashboard/overview" },
  { id: "bookings", label: "My Bookings", icon: Calendar, path: "/dashboard/bookings" },
  { id: "profile", label: "Profile", icon: User, path: "/dashboard/profile" },
  { id: "queries", label: "My Queries", icon: Mail, path: "/dashboard/queries" },
] as const;

function DashboardLayout() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && user && user.role === "admin") {
      void navigate({ to: "/admin" });
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    void navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface/50">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-ink">Please log in to view your dashboard.</p>
          <Link
            to="/login"
            className="mt-4 inline-flex h-11 px-6 items-center rounded-full gradient-brand text-white text-sm"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface/50">
      <div className="container-page py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className={cn(
              "h-16 w-16 rounded-full font-bold text-xl inline-flex items-center justify-center ring-4 ring-background shadow-card overflow-hidden",
              user.avatar ? "bg-background" : "gradient-brand text-white",
            )}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">Manage your bookings and account.</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-soft">
              {tabs.map((t) => {
                const active = location.pathname.startsWith(t.path);
                const Icon = t.icon;
                return (
                  <Link
                    key={t.id}
                    to={t.path}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "text-foreground/70 hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </Link>
                );
              })}
              <ConfirmModal
                title="Log out"
                description="Are you sure you want to log out?"
                onConfirm={handleLogout}
                confirmText="Log out"
              >
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/60 hover:bg-muted hover:text-destructive transition-all">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </ConfirmModal>
            </div>
          </aside>

          <section>
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
