import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Mail,
  Clock,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  CornerDownRight,
} from "lucide-react";
import { getUserQueries } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/queries")({
  component: UserQueriesTab,
});

function UserQueriesTab() {
  const { data: queriesRes, isLoading } = useQuery({
    queryKey: ["userQueries"],
    queryFn: getUserQueries,
  });

  const queries = queriesRes?.data ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">My Queries</h2>
          <p className="text-sm text-muted-foreground">Track all contact submissions and replies</p>
        </div>
        <Link
          to="/contact"
          className="inline-flex h-10 px-4 items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider gradient-brand text-white shadow-soft hover:-translate-y-0.5 transition-transform"
        >
          New Inquiry <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-border/80 bg-card text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <HelpCircle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink">No inquiries submitted yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm px-6">
            If you have questions about bookings, pricing, or custom options, send us a message!
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-flex h-9 px-4 items-center rounded-full text-xs font-semibold bg-muted hover:bg-muted/80 text-primary transition-colors"
          >
            Visit Contact Page
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((q) => (
            <motion.div
              layout
              key={q._id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-4">
                <div>
                  <h3 className="text-base font-bold text-ink">{q.subject}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted on {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider self-start sm:self-center border",
                    q.isReplied
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                  )}
                >
                  {q.isReplied ? (
                    <>
                      <CheckCircle className="h-2.5 w-2.5" /> Replied
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-2.5 w-2.5" /> Under Review
                    </>
                  )}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="text-sm text-foreground/80 leading-relaxed pl-1 whitespace-pre-wrap">
                  {q.message}
                </div>

                {q.isReplied && q.reply && (
                  <div className="relative rounded-2xl bg-muted/60 p-4 border border-border/40 ml-1 sm:ml-4 flex gap-3">
                    <div className="h-5 w-5 mt-0.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <CornerDownRight className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                        Support Response
                      </p>
                      <p className="text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap">
                        "{q.reply}"
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Replied on {q.repliedAt ? new Date(q.repliedAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
