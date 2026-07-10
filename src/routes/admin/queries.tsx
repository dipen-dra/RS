import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Clock, MessageSquare, CheckCircle, Send, X, Inbox, User } from "lucide-react";
import { getAdminQueries, replyToQuery, ContactQuery } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/queries")({
  component: AdminQueriesTab,
});

function AdminQueriesTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: queriesRes, isLoading } = useQuery({
    queryKey: ["adminQueries"],
    queryFn: getAdminQueries,
  });

  const queries = queriesRes?.data ?? [];

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyToQuery(id, reply),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Reply sent successfully!");
        queryClient.invalidateQueries({ queryKey: ["adminQueries"] });
        setSelectedQuery(null);
        setReplyText("");
      } else {
        toast.error("Failed to send reply.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  const filteredQueries = queries.filter((q) => {
    if (filter === "pending") return !q.isReplied;
    if (filter === "replied") return q.isReplied;
    return true;
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;
    if (!replyText.trim()) {
      toast.error("Reply text cannot be empty.");
      return;
    }
    replyMutation.mutate({ id: selectedQuery._id, reply: replyText });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">User Inquiries</h2>
          <p className="text-sm text-muted-foreground">Manage and respond to customer queries</p>
        </div>
        <div className="inline-flex rounded-xl bg-card border border-border p-1 self-start">
          {(["all", "pending", "replied"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                filter === f
                  ? "gradient-brand text-white shadow-soft"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              {f === "pending" ? "Pending Reply" : f}
            </button>
          ))}
        </div>
      </div>

      {filteredQueries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-border/80 bg-card text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink">No inquiries found</p>
          <p className="text-sm text-muted-foreground mt-1">
            There are no queries in this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredQueries.map((q) => (
            <motion.div
              layoutId={`query-card-${q._id}`}
              key={q._id}
              onClick={() => setSelectedQuery(q)}
              className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {q.user?.avatar ? (
                    <img
                      src={q.user.avatar}
                      alt={q.name}
                      className="h-9 w-9 rounded-full object-cover border border-border/40"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {q.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                      {q.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    q.isReplied
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                  )}
                >
                  {q.isReplied ? (
                    <>
                      <CheckCircle className="h-2.5 w-2.5" /> Replied
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-2.5 w-2.5" /> Pending
                    </>
                  )}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm font-bold text-ink truncate">{q.subject}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {q.message}
                </p>
              </div>

              {q.user && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-primary">
                  <User className="h-3 w-3" /> Registered User
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-glow"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-6">
                <div className="flex items-center gap-3">
                  {selectedQuery.user?.avatar ? (
                    <img
                      src={selectedQuery.user.avatar}
                      alt={selectedQuery.name}
                      className="h-10 w-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {selectedQuery.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">Inquiry Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From {selectedQuery.name} &middot; {selectedQuery.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedQuery(null);
                    setReplyText("");
                  }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="rounded-2xl bg-muted/50 p-4 border border-border/40">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Subject
                  </p>
                  <p className="text-sm font-bold text-ink mt-0.5">{selectedQuery.subject}</p>

                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-4">
                    Message
                  </p>
                  <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap leading-relaxed">
                    {selectedQuery.message}
                  </p>
                </div>

                {selectedQuery.isReplied ? (
                  <div className="rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/20">
                    <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Previous Reply
                    </p>
                    <p className="text-sm text-emerald-900 dark:text-emerald-300 mt-1 whitespace-pre-wrap leading-relaxed">
                      "{selectedQuery.reply}"
                    </p>
                    <p className="text-[10px] text-emerald-600/70 mt-2">
                      Replied on{" "}
                      {selectedQuery.repliedAt
                        ? new Date(selectedQuery.repliedAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Write a Reply
                      </span>
                      <textarea
                        rows={4}
                        placeholder="Type support reply here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="mt-1.5 w-full p-4 rounded-2xl bg-muted border border-border/40 focus:border-primary focus:outline-none text-sm text-ink leading-relaxed"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={replyMutation.isPending}
                      className="w-full h-11 rounded-full gradient-brand text-white font-semibold inline-flex items-center justify-center shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {replyMutation.isPending ? "Sending..." : "Send Reply"}{" "}
                      <Send className="ml-2 h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
