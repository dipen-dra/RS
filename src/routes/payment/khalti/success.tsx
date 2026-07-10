import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Search = { bookingId?: string };

export const Route = createFileRoute("/payment/khalti/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    bookingId: typeof s.bookingId === "string" ? s.bookingId : undefined,
  }),
  head: () => ({ meta: [{ title: "Card Payment Success — RentalSphere" }] }),
  component: KhaltiSuccess,
});

function KhaltiSuccess() {
  const { bookingId } = Route.useSearch();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["myBookings"] });
  }, [queryClient]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center container-page py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-8 md:p-10 text-center shadow-soft"
      >
        <div className="mx-auto h-16 w-16 rounded-full gradient-brand inline-flex items-center justify-center text-white shadow-[var(--shadow-glow)]">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Successful!</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Your booking has been confirmed and paid.
        </p>

        {bookingId && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 text-sm">
            <span className="text-muted-foreground">Booking ID</span>
            <span className="font-mono font-semibold text-ink">
              {bookingId.slice(-6).toUpperCase()}
            </span>
          </div>
        )}

        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/dashboard/bookings"
            className="h-11 px-6 inline-flex items-center rounded-full gradient-brand text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform"
          >
            View My Bookings
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
