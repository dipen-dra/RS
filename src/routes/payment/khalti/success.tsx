import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";

// Khalti v2 sends these query params on redirect:
// pidx, txnId, amount, total_amount, mobile, status, purchase_order_id, purchase_order_name, transaction_id
type KhaltiSearch = {
  pidx?: string;
  status?: string;
  purchase_order_id?: string;
  txnId?: string;
  amount?: string;
  total_amount?: string;
};

export const Route = createFileRoute("/payment/khalti/success")({
  validateSearch: (s: Record<string, unknown>): KhaltiSearch => ({
    pidx: typeof s.pidx === "string" ? s.pidx : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    purchase_order_id: typeof s.purchase_order_id === "string" ? s.purchase_order_id : undefined,
    txnId: typeof s.txnId === "string" ? s.txnId : undefined,
    amount: typeof s.amount === "string" ? s.amount : undefined,
    total_amount: typeof s.total_amount === "string" ? s.total_amount : undefined,
  }),
  head: () => ({ meta: [{ title: "Khalti Payment — RentalSphere" }] }),
  component: KhaltiSuccess,
});

function KhaltiSuccess() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verify = async () => {
      const { pidx, status, purchase_order_id } = search;

      if (status && status !== "Completed") {
        setState("error");
        setErrorMsg(`Payment was not completed. Status: ${status}`);
        return;
      }

      if (!pidx) {
        setState("error");
        setErrorMsg("No payment reference found. Please contact support.");
        return;
      }

      // purchase_order_id from URL (set by us during initiate)
      const bookingIdFromUrl = purchase_order_id;

      // Fallback: check sessionStorage for bookingId
      let bookingIdToUse = bookingIdFromUrl;
      if (!bookingIdToUse) {
        try {
          const stored = sessionStorage.getItem("khalti_pending");
          if (stored) {
            const parsed = JSON.parse(stored);
            bookingIdToUse = parsed.bookingId;
          }
        } catch {}
      }

      if (!bookingIdToUse) {
        setState("error");
        setErrorMsg("Booking session not found. Please contact support.");
        return;
      }

      try {
        const res = await request<{ success: boolean; data: { _id: string } }>(
          "/payment/khalti/verify",
          {
            method: "POST",
            body: JSON.stringify({ pidx, bookingId: bookingIdToUse }),
          }
        );
        sessionStorage.removeItem("khalti_pending");
        queryClient.invalidateQueries({ queryKey: ["myBookings"] });
        setBookingId(res.data._id);
        setState("success");
      } catch (err: any) {
        setState("error");
        setErrorMsg(err?.message || "Payment verification failed. Please contact support.");
      }
    };

    void verify();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[80vh] flex items-center justify-center container-page py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-8 md:p-10 text-center shadow-soft"
      >
        {state === "loading" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-[#5C2D91]/10 inline-flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#5C2D91] animate-spin" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Verifying payment…</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Please wait while we confirm your Khalti payment.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-full gradient-brand inline-flex items-center justify-center text-white shadow-[var(--shadow-glow)]">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Successful!</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Your booking has been confirmed and paid via Khalti.
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

        {state === "error" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 inline-flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold text-ink">Payment Failed</h2>
            <p className="mt-2 text-muted-foreground text-sm">{errorMsg}</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link
                to="/cars"
                className="h-11 px-6 inline-flex items-center rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Browse Vehicles
              </Link>
              <Link
                to="/contact"
                className="h-11 px-6 inline-flex items-center rounded-full gradient-brand text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
