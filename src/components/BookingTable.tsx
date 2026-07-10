import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { updateBookingStatus, deleteBooking, type Booking, type BookingStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusStyle: Record<BookingStatus, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function BookingTable({ rows, showActions }: { rows: Booking[]; showActions?: boolean }) {
  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      toast.success("Booking status updated");
    },
    onError: () => {
      toast.error("Failed to update booking status");
    },
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      toast.success("Booking deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete booking");
    },
  });

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
        <tr>
          <th className="px-5 py-3">Booking</th>
          <th className="px-5 py-3">Customer</th>
          <th className="px-5 py-3">Vehicle</th>
          <th className="px-5 py-3">Dates</th>
          <th className="px-5 py-3">Total</th>
          <th className="px-5 py-3">Status</th>
          {showActions && <th className="px-5 py-3" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => (
          <tr key={b._id} className="border-t border-border hover:bg-muted/30 transition-colors">
            <td className="px-5 py-3 font-medium text-ink">{b.bookingId}</td>
            <td className="px-5 py-3">
              <div className="text-ink">{b.customerName}</div>
              <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
            </td>
            <td className="px-5 py-3">{b.vehicleName}</td>
            <td className="px-5 py-3 text-xs text-muted-foreground">
              {b.startDate} → {b.endDate}
            </td>
            <td className="px-5 py-3 font-medium text-ink">£{b.total.toLocaleString()}</td>
            <td className="px-5 py-3">
              {showActions ? (
                <select
                  value={b.status}
                  onChange={(e) =>
                    updateStatus({ id: b._id, status: e.target.value as BookingStatus })
                  }
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full capitalize border-0 focus:outline-none cursor-pointer",
                    statusStyle[b.status],
                  )}
                >
                  {(["upcoming", "active", "completed", "cancelled"] as BookingStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              ) : (
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                    statusStyle[b.status],
                  )}
                >
                  {b.status}
                </span>
              )}
            </td>
            {showActions && (
              <td className="px-5 py-3 text-right">
                <ConfirmModal
                  title="Delete Booking"
                  description="Are you sure you want to permanently delete this booking?"
                  onConfirm={() => doDelete(b._id)}
                  confirmText="Delete"
                >
                  <button className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </ConfirmModal>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
