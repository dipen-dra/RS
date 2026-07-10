import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  CalendarCheck,
  CreditCard,
  Tag,
  AlertTriangle,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
  type NotifType,
} from "@/lib/api";

const meta: Record<NotifType, { icon: React.ComponentType<{ className?: string }>; tint: string }> =
  {
    booking: { icon: CalendarCheck, tint: "bg-primary/10 text-primary" },
    payment: { icon: CreditCard, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    promo: { icon: Tag, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    alert: { icon: AlertTriangle, tint: "bg-destructive/10 text-destructive" },
    message: { icon: MessageSquare, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  };

function formatTime(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await getNotifications();
      return res.data;
    },
    // Poll every 30 seconds for new notifications
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<AppNotification[]>(["notifications"]);
      queryClient.setQueryData<AppNotification[]>(["notifications"], (old) =>
        old?.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications"], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<AppNotification[]>(["notifications"]);
      queryClient.setQueryData<AppNotification[]>(["notifications"], (old) =>
        old?.map((n) => ({ ...n, read: true })),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications"], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((i) => !i.read).length;
  const visible = filter === "unread" ? notifications.filter((i) => !i.read) : notifications;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAll = () => markAllMutation.mutate();
  const markOne = (id: string) => markReadMutation.mutate(id);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden z-50"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div>
                <h3 className="font-display text-base font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </p>
              </div>
              <button
                onClick={markAll}
                disabled={unread === 0 || markAllMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>

            <div className="px-4 pb-2 flex items-center gap-1">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 h-7 rounded-full text-xs font-medium transition-colors capitalize",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground/70 hover:bg-muted/70",
                  )}
                >
                  {f}
                  {f === "unread" && unread > 0 ? ` · ${unread}` : ""}
                </button>
              ))}
            </div>

            <ul className="max-h-[26rem] overflow-y-auto divide-y divide-border">
              {visible.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  Nothing here yet.
                </li>
              )}
              {visible.map((n) => {
                const Icon = meta[n.type].icon;
                const content = (
                  <div
                    className={cn(
                      "group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        meta[n.type].tint,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight truncate">{n.title}</p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOne(n._id);
                        }}
                        aria-label="Mark as read"
                        className="self-center inline-flex h-6 w-6 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-background border border-border transition-opacity"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    {!n.read && (
                      <span
                        className="self-center h-2 w-2 rounded-full bg-primary shrink-0 group-hover:hidden"
                        aria-hidden
                      />
                    )}
                  </div>
                );
                return (
                  <li key={n._id}>
                    {n.href ? (
                      <Link
                        to={n.href}
                        onClick={() => {
                          if (!n.read) markOne(n._id);
                          setOpen(false);
                        }}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div
                        onClick={() => {
                          if (!n.read) markOne(n._id);
                        }}
                        className="cursor-pointer"
                      >
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-3.5 w-3.5" /> Preferences
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
