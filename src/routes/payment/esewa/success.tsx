import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, XCircle, Loader2, ArrowRight } from "lucide-react";
import { verifyEsewaPayment } from "@/lib/api";

type Search = { data?: string };

export const Route = createFileRoute("/payment/esewa/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    data: typeof s.data === "string" ? s.data : undefined,
  }),
  head: () => ({ meta: [{ title: "PayPal Payment Success — RentalSphere" }] }),
  component: EsewaSuccess,
});

function EsewaSuccess() {
  const queryClient = useQueryClient();
  const { data } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setStatus("error");
      setErrorMsg("No payment data found in URL.");
      return;
    }

    verifyEsewaPayment(data)
      .then((res: any) => {
        setStatus("success");
        setBookingId(res.data._id); // Assuming backend returns the MongoDB _id
        queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMsg(err.message || "Payment verification failed.");
      });
  }, [data]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center container-page py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-8 md:p-10 text-center shadow-soft"
      >
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="mt-6 font-display text-2xl font-bold">Verifying Payment...</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Please wait while we confirm your transaction with PayPal.
            </p>
          </>
        )}

        {status === "success" && (
          <>
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
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Failed</h2>
            <p className="mt-2 text-muted-foreground text-sm">{errorMsg}</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link
                to="/dashboard"
                className="h-11 px-6 inline-flex items-center rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
