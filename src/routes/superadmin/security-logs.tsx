import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, ShieldX, Info, AlertTriangle,
  Ban, Search, RefreshCw, Unlock,
} from "lucide-react";
import { request } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/security-logs")({
  component: SecurityLogsPage,
});

interface AuditLog {
  _id: string;
  timestamp: string;
  eventType: string;
  severity: "info" | "warning" | "critical";
  userId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

interface BlockedIP {
  ip: string;
  reason: string;
  expiresAt: number;
}

const severityConfig = {
  info:     { icon: Info,          color: "text-blue-500",  bg: "bg-blue-500/10",  label: "Info" },
  warning:  { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Warning" },
  critical: { icon: ShieldAlert,   color: "text-red-500",   bg: "bg-red-500/10",   label: "Critical" },
};

const eventIcons: Record<string, React.ElementType> = {
  AUTH_FAILED: ShieldX, AUTH_SUCCESS: ShieldCheck,
  MFA_ENABLED: ShieldCheck, MFA_DISABLED: ShieldAlert, MFA_FAILED: ShieldX, MFA_SUCCESS: ShieldCheck,
  PASSWORD_CHANGED: ShieldCheck, PAYMENT_TAMPERING: Ban, IDOR_ATTEMPT: Ban,
  UNAUTHORIZED_ACCESS: Ban, ADMIN_ACTION: ShieldAlert, ACCOUNT_LOCKED: Ban,
  IP_BLOCKED: Ban, SESSION_INVALIDATED: ShieldCheck, DATA_EXPORT: Info, SUSPICIOUS_REQUEST: AlertTriangle,
};

function SecurityLogsPage() {
  const [page, setPage] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [searchId, setSearchId] = useState("");
  const [activeTab, setActiveTab] = useState<"logs" | "blocked">("logs");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, filterSeverity, filterEvent, searchId],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (filterSeverity) params.set("severity", filterSeverity);
      if (filterEvent)    params.set("eventType", filterEvent);
      if (searchId)       params.set("userId", searchId);
      return request<{ success: boolean; data: AuditLog[]; pagination: { page: number; pages: number; total: number } }>(
        `/users/admin/audit-logs?${params.toString()}`,
      );
    },
  });

  const { data: blockedData, refetch: refetchBlocked } = useQuery({
    queryKey: ["blocked-ips"],
    queryFn: () => request<{ success: boolean; data: BlockedIP[] }>("/users/admin/blocked-ips"),
    enabled: activeTab === "blocked",
  });

  const unblockIp = async (ip: string) => {
    try {
      await request(`/users/admin/blocked-ips/${encodeURIComponent(ip)}`, { method: "DELETE" });
      toast.success(`IP ${ip} unblocked`);
      void refetchBlocked();
    } catch {
      toast.error("Failed to unblock IP");
    }
  };

  const logs = data?.data ?? [];
  const pagination = data?.pagination;
  const blockedIPs = blockedData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Security Logs</h1>
            <p className="text-sm text-muted-foreground">Audit trail for all security events</p>
          </div>
        </div>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["logs", "blocked"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-amber-500 text-white shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "blocked" ? "Blocked IPs" : "Audit Logs"}
          </button>
        ))}
      </div>

      {activeTab === "logs" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-muted border-2 border-transparent focus-within:border-amber-500 transition-colors min-w-[180px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={searchId}
                onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
                placeholder="Filter by User ID…"
                className="bg-transparent text-sm outline-none w-full"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-xl bg-muted text-sm outline-none border-2 border-transparent focus:border-amber-500 transition-colors"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filterEvent}
              onChange={(e) => { setFilterEvent(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-xl bg-muted text-sm outline-none border-2 border-transparent focus:border-amber-500 transition-colors"
            >
              <option value="">All Events</option>
              {["AUTH_FAILED","AUTH_SUCCESS","MFA_ENABLED","MFA_DISABLED","MFA_FAILED","MFA_SUCCESS",
                "PASSWORD_CHANGED","PAYMENT_TAMPERING","IDOR_ATTEMPT","UNAUTHORIZED_ACCESS",
                "ADMIN_ACTION","ACCOUNT_LOCKED","IP_BLOCKED","SESSION_INVALIDATED","DATA_EXPORT","SUSPICIOUS_REQUEST"
              ].map((e) => (
                <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Log table */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <span className="h-6 w-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <ShieldCheck className="h-10 w-10 opacity-30" />
                <p className="text-sm">No security events found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log, i) => {
                  const sev = severityConfig[log.severity] ?? severityConfig.info;
                  const SevIcon = sev.icon;
                  const EventIcon = eventIcons[log.eventType] ?? ShieldAlert;
                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${sev.bg}`}>
                        <EventIcon className={`h-4 w-4 ${sev.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold">
                            {log.eventType.replace(/_/g, " ")}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sev.bg} ${sev.color} font-medium`}>
                            <SevIcon className="h-3 w-3" />{sev.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          {log.userId && <span>User: {log.userId.slice(-8)}</span>}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">{pagination.total} total events</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-muted disabled:opacity-40 hover:bg-muted/70 transition-colors"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 font-medium">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1.5 rounded-lg bg-muted disabled:opacity-40 hover:bg-muted/70 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Blocked IPs */}
      {activeTab === "blocked" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {blockedIPs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <ShieldCheck className="h-10 w-10 opacity-30" />
              <p className="text-sm">No IPs currently blocked</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {blockedIPs.map((item) => (
                <div key={item.ip} className="flex items-center justify-between p-4 gap-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">{item.ip}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reason} · Expires {new Date(item.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => void unblockIp(item.ip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                  >
                    <Unlock className="h-3 w-3" /> Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
