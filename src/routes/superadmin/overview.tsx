import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ShieldAlert, Calendar, TrendingUp, Crown,
  Activity, AlertTriangle, CheckCircle, ArrowRight,
} from "lucide-react";
import { getAllUsers, getAdminStats, request } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/overview")({
  component: SuperAdminOverview,
});

function SuperAdminOverview() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    refetchInterval: 30_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getAllUsers,
  });

  const { data: logsData } = useQuery({
    queryKey: ["audit-logs-summary"],
    queryFn: () =>
      request<{ success: boolean; data: any[]; pagination: any }>(
        "/users/admin/audit-logs?limit=5",
      ),
  });

  const stats = statsData?.data;
  const users = usersData?.data ?? [];
  const recentLogs = logsData?.data ?? [];

  const roleCount = users.reduce(
    (acc: Record<string, number>, u: any) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {},
  );

  const kpis = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      sub: `${roleCount.admin || 0} admin · ${roleCount.superadmin || 0} superadmin`,
      accent: false,
    },
    {
      label: "Total Bookings",
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
      sub: `${stats?.activeBookings ?? 0} active`,
      accent: false,
    },
    {
      label: "Revenue",
      value: `Rs. ${(stats?.revenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      sub: "All time",
      accent: true,
    },
    {
      label: "Security Events",
      value: logsData?.pagination?.total ?? 0,
      icon: ShieldAlert,
      sub: "Audit log entries",
      accent: false,
    },
  ];

  const sevColor: Record<string, string> = {
    info: "text-blue-500 bg-blue-500/10",
    warning: "text-amber-500 bg-amber-500/10",
    critical: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className={cn(
              "rounded-2xl border p-5 shadow-soft",
              k.accent
                ? "bg-amber-500 text-white border-transparent shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                : "bg-card border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("text-xs uppercase tracking-wider", k.accent ? "text-white/80" : "text-muted-foreground")}>
                {k.label}
              </span>
              <k.icon className={cn("h-4 w-4", k.accent ? "text-white" : "text-amber-500")} />
            </div>
            <div className={cn("mt-3 font-display text-2xl font-bold", k.accent ? "text-white" : "text-ink")}>
              {isLoading ? "—" : k.value}
            </div>
            <p className={cn("mt-1 text-xs", k.accent ? "text-white/80" : "text-muted-foreground")}>{k.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Role distribution */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold text-ink">User Roles</h3>
            <Link to="/superadmin/users" className="text-xs text-amber-500 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {[
            { role: "superadmin", label: "Super Admin", color: "bg-amber-500" },
            { role: "admin",      label: "Admin",       color: "bg-primary" },
            { role: "user",       label: "User",        color: "bg-muted-foreground/40" },
          ].map((r) => {
            const count = roleCount[r.role] || 0;
            const pct = users.length ? Math.round((count / users.length) * 100) : 0;
            return (
              <div key={r.role} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${r.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent security events */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold text-ink">Recent Security Events</h3>
            <Link to="/superadmin/security-logs" className="text-xs text-amber-500 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <CheckCircle className="h-8 w-8 opacity-30" />
              <p className="text-sm">No recent events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div key={log._id} className="flex items-center gap-3">
                  <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", sevColor[log.severity] || sevColor.info)}>
                    {log.severity === "critical" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <Activity className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-semibold truncate">{log.eventType.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", sevColor[log.severity] || sevColor.info)}>
                    {log.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" /> Quick Actions
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/superadmin/users" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-amber-500/40 transition-colors">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold">Manage Roles</p>
              <p className="text-xs text-muted-foreground">Promote or demote users</p>
            </div>
          </Link>
          <Link to="/superadmin/security-logs" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-amber-500/40 transition-colors">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold">Security Logs</p>
              <p className="text-xs text-muted-foreground">Audit trail & blocked IPs</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
