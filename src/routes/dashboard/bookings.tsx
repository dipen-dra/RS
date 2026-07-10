import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { getMyBookings, type BookingStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BookingRow, EmptyState, SkeletonCard } from "@/components/UserBookingComponents";

export const Route = createFileRoute("/dashboard/bookings")({
  component: DashboardBookingsTab,
});

function DashboardBookingsTab() {
  const { data: bookingsData, isLoading: loading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: () => getMyBookings(),
  });

  const bookings = bookingsData?.data ?? [];
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const filters: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink mb-4">My bookings</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 px-4 rounded-full text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground/70 hover:bg-muted/70",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings here"
          desc="Try another filter or book a new ride."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingRow key={b._id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
