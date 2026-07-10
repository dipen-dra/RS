import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAllBookings } from "@/lib/api";
import { BookingTable } from "@/components/BookingTable";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsTab,
});

function BookingsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["adminBookings"], queryFn: getAllBookings });
  const bookings = data?.data ?? [];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <BookingTable rows={bookings} showActions />
      )}
    </div>
  );
}
