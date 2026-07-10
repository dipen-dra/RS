import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Menu, X, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.png";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Home" },
  { to: "/cars", label: "Cars" },
  { to: "/bikes", label: "Bikes" },
  { to: "/locations", label: "Locations" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { location } = useRouterState();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = scrollY.on("change", (y) => setScrolled(y > 24));
    return () => unsub();
  }, [scrollY]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const blur = useTransform(scrollY, [0, 100], [0, 14]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    void navigate({ to: "/" });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <motion.header
      style={{ backdropFilter: blur.get() ? `saturate(160%) blur(${blur.get()}px)` : undefined }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgb(15_23_42_/_0.06)] border-b border-border/60"
          : "bg-transparent",
      )}
    >
      <div className="container-page flex h-16 md:h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="RentalSphere Logo"
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            RentalSphere
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => {
            const active =
              location.pathname === n.to || (n.to !== "/" && location.pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                  active ? "text-primary" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {n.label}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isLoading ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-20 rounded-full bg-muted animate-pulse" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              {user.role === "admin" ? (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 transition-colors"
                  aria-label="Admin Console"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 transition-colors"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}
              <div className="hidden md:block">
                <NotificationCenter />
              </div>

              {/* Avatar dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((s) => !s)}
                  className={cn(
                    "h-9 w-9 rounded-full font-semibold text-sm inline-flex items-center justify-center shadow-sm ring-1 ring-border hover:ring-primary/50 hover:opacity-90 transition-all",
                    user.avatar ? "bg-background p-0.5" : "gradient-brand text-white",
                  )}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    {/* Invisible backdrop for closing dropdown on outside click */}
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />

                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-12 w-48 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        >
                          <Shield className="h-3.5 w-3.5" /> Admin Panel
                        </Link>
                      )}
                      <ConfirmModal
                        title="Log out"
                        description="Are you sure you want to log out of your account?"
                        onConfirm={handleLogout}
                        confirmText="Log out"
                      >
                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <LogOut className="h-3.5 w-3.5" /> Logout
                        </button>
                      </ConfirmModal>
                    </motion.div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 transition-colors"
                aria-label="Dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>
              <div className="hidden md:block">
                <NotificationCenter />
              </div>
              <Link
                to="/login"
                className="hidden md:inline-flex h-10 items-center px-4 rounded-full text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden md:inline-flex h-10 items-center px-5 rounded-full text-sm font-medium gradient-brand text-white shadow-[var(--shadow-glow)] hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen((s) => !s)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl"
        >
          <div className="container-page py-4 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            {isLoading ? (
              <div className="flex gap-2 pt-3 border-t border-border mt-1">
                <div className="flex-1 h-11 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 h-11 rounded-full bg-muted animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              <div className="mt-8 flex gap-3">
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  className="flex-1 h-11 inline-flex items-center justify-center rounded-full border border-border text-sm font-medium"
                >
                  {user.role === "admin" ? "Admin Console" : "Dashboard"}
                </Link>
                <ConfirmModal
                  title="Log out"
                  description="Are you sure you want to log out?"
                  onConfirm={handleLogout}
                  confirmText="Log out"
                >
                  <button className="flex-1 h-11 inline-flex items-center justify-center rounded-full gradient-brand text-white text-sm font-medium">
                    Logout
                  </button>
                </ConfirmModal>
              </div>
            ) : (
              <div className="flex gap-2 pt-3">
                <Link
                  to="/login"
                  className="flex-1 h-11 inline-flex items-center justify-center rounded-full border border-border text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 h-11 inline-flex items-center justify-center rounded-full gradient-brand text-white text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
