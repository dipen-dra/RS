import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Activity, Calendar, Car, TrendingUp, ArrowUpRight } from "lucide-react";
import { getAdminStats, getAllBookings, getVehicles } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BookingTable } from "@/components/BookingTable";

export const Route = createFileRoute("/admin/overview")({
  component: OverviewTab,
});

function OverviewTab() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  });
  const { data: bookingsData } = useQuery({ queryKey: ["adminBookings"], queryFn: getAllBookings });
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => getVehicles({}),
  });

  const stats = statsData?.data;
  const recentBookings = (bookingsData?.data ?? []).slice(0, 5);
  const topVehicles = (vehiclesData?.data ?? []).slice(0, 5);

  if (isLoading)
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
    );

  const kpis = [
    {
      label: "Revenue (GBP)",
      value: (stats?.revenue ?? 0).toLocaleString(),
      icon: DollarSign,
      accent: true,
    },
    { label: "Active rentals", value: stats?.activeBookings ?? 0, icon: Activity },
    { label: "Total bookings", value: stats?.totalBookings ?? 0, icon: Calendar },
    { label: "Fleet size", value: stats?.totalVehicles ?? 0, icon: Car },
  ];

  const sparkData = stats?.dailyRevenue?.length
    ? stats.dailyRevenue.map((d) => d.revenue)
    : [42, 58, 51, 70, 64, 88, 96];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <motion.div
            key={k.label}
            whileHover={{ y: -2 }}
            className={cn(
              "rounded-2xl border p-5 shadow-soft",
              k.accent ? "gradient-brand text-white border-transparent" : "bg-card border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs uppercase tracking-wider",
                  k.accent ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {k.label}
              </span>
              <k.icon className={cn("h-4 w-4", k.accent ? "text-white" : "text-primary")} />
            </div>
            <div
              className={cn(
                "mt-3 font-display text-2xl font-bold",
                k.accent ? "text-white" : "text-ink",
              )}
            >
              {k.value}
            </div>
            <div
              className={cn(
                "mt-1 text-xs inline-flex items-center gap-1",
                k.accent ? "text-white/90" : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              <TrendingUp className="h-3 w-3" /> Live
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink">Revenue · last 7 days</h3>
            <span className="text-xs text-muted-foreground">GBP</span>
          </div>
          <SparkBars data={sparkData} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold text-ink mb-4">Top vehicles</h3>
          <ul className="space-y-3">
            {topVehicles.map((v, i) => (
              <li key={v._id} className="flex items-center gap-3">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                <img src={v.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.reviews} reviews</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Recent bookings</h3>
        </div>
        <BookingTable rows={recentBookings} />
      </div>
    </div>
  );
}

function SparkBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
            className="w-full rounded-t-lg gradient-brand shadow-[var(--shadow-glow)]"
          />
          <span className="text-[10px] text-muted-foreground">{days[i % 7]}</span>
        </div>
      ))}
    </div>
  );
}
