import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/payment/esewa/failure")({
  head: () => ({ meta: [{ title: "eSewa Payment Failed — RentalSphere" }] }),
  component: EsewaFailure,
});

function EsewaFailure() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center container-page py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-8 md:p-10 text-center shadow-soft"
      >
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 inline-flex items-center justify-center text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-ink">
          Payment Failed or Cancelled
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Your transaction with eSewa could not be completed. Your booking was not confirmed.
        </p>

        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/cars"
            className="h-11 px-6 inline-flex items-center rounded-full gradient-brand text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform"
          >
            Browse Vehicles
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
