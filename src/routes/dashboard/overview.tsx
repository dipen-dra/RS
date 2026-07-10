import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Car, Clock, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { getMyBookings } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BookingRow, EmptyState, SkeletonCard } from "@/components/UserBookingComponents";

export const Route = createFileRoute("/dashboard/overview")({
  component: DashboardOverviewTab,
});

function DashboardOverviewTab() {
  const { data: bookingsData, isLoading: loading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: () => getMyBookings(),
  });

  const bookings = bookingsData?.data ?? [];
  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "active").length,
    upcoming: bookings.filter((b) => b.status === "upcoming").length,
    spend: bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.total, 0),
  };

  const recent = bookings.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total bookings" value={stats.total} icon={Car} />
        <StatCard label="Active now" value={stats.active} icon={Clock} accent />
        <StatCard label="Upcoming" value={stats.upcoming} icon={Calendar} />
        <StatCard
          label="Lifetime spend"
          value={`£${stats.spend.toLocaleString()}`}
          icon={CreditCard}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">Recent bookings</h2>
          <Link
            to="/cars"
            className="text-sm text-primary font-medium inline-flex items-center gap-1"
          >
            Book again <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No bookings yet"
            desc="Browse our fleet and book your first ride."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((b) => (
              <BookingRow key={b._id} b={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-border p-5 shadow-soft",
        accent ? "gradient-brand text-white border-transparent" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs uppercase tracking-wider",
            accent ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <Icon className={cn("h-4 w-4", accent ? "text-white" : "text-primary")} />
      </div>
      <div
        className={cn("mt-3 font-display text-2xl font-bold", accent ? "text-white" : "text-ink")}
      >
        {value}
      </div>
    </motion.div>
  );
}
