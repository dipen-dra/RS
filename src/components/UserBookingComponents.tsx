import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  CreditCard,
  X,
  Shield,
  User,
  Tag,
  Receipt,
  Info,
  Clock,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { cancelBooking, type Booking, type BookingStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export const statusStyle: Record<BookingStatus, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function BookingDetailsModal({ b, onClose }: { b: Booking; onClose: () => void }) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Booking Details
            </span>
            <h2 className="font-display text-xl font-bold text-ink mt-0.5 flex items-center gap-2">
              {b.bookingId}
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize",
                  statusStyle[b.status],
                )}
              >
                {b.status}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-ink transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-foreground">
          {/* Vehicle Info */}
          <div className="flex gap-4 p-4 rounded-2xl bg-surface/60 border border-border/50">
            <img
              src={b.vehicleImage}
              alt={b.vehicleName}
              className="h-16 w-24 rounded-lg object-cover bg-muted shrink-0"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider font-semibold">
                Reserved Vehicle
              </span>
              <h3 className="font-display text-base font-semibold text-ink mt-0.5">
                {b.vehicleName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily base rate: £{Math.round(b.subtotal / b.days).toLocaleString()} / day
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rental Schedule */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2 pb-2 border-b border-border/60">
                <Calendar className="h-4 w-4 text-primary" /> Rental Schedule
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Pickup
                  </p>
                  <p className="font-medium text-ink mt-0.5">{formatDate(b.startDate)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {b.pickup}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Return
                  </p>
                  <p className="font-medium text-ink mt-0.5">{formatDate(b.endDate)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {b.dropoff || b.pickup}
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    <Clock className="h-3.5 w-3.5" /> Total Duration: {b.days}{" "}
                    {b.days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>

            {/* Renter Details */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2 pb-2 border-b border-border/60">
                <User className="h-4 w-4 text-primary" /> Renter Information
              </h4>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Primary Driver
                  </p>
                  <p className="font-medium text-ink mt-0.5">{b.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Email Address
                  </p>
                  <p className="font-medium text-ink mt-0.5">{b.customerEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Phone Number
                  </p>
                  <p className="font-medium text-ink mt-0.5">{b.customerPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Driving License
                  </p>
                  <p className="font-medium text-ink mt-0.5">{b.license}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="space-y-3 pt-4 border-t border-border/80">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2 pb-2 border-b border-border/60">
              <Receipt className="h-4 w-4 text-primary" /> Invoice Billing Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Rental (Daily rate × days)</span>
                <span className="font-medium text-ink">£{b.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Insurance Cover (
                  {b.insurance || "basic"})
                </span>
                <span className="font-medium text-ink">
                  {b.insurance === "max"
                    ? "£10/day"
                    : b.insurance === "plus"
                      ? "£5/day"
                      : "Included"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Add-ons ({b.addons && b.addons.length > 0 ? b.addons.join(", ") : "None"})
                </span>
                <span className="font-medium text-ink">
                  {b.addons && b.addons.length > 0 ? "Included in daily rate" : "£0"}
                </span>
              </div>
              {b.pickup !== b.dropoff && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">One-way drop-off fee</span>
                  <span className="font-medium text-ink">£10</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee (5%)</span>
                <span className="font-medium text-ink">£{b.serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (20%)</span>
                <span className="font-medium text-ink">£{b.vat.toLocaleString()}</span>
              </div>
              {b.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Discount (Coupon: {b.couponCode})
                  </span>
                  <span>- £{b.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex items-baseline justify-between">
                <span className="font-bold text-ink text-base">Total Amount</span>
                <span className="font-display text-2xl font-bold text-primary">
                  £{b.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Info */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 flex gap-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink">Payment Method: {b.payment}</p>
              <p className="mt-0.5">
                {b.payment === "Cash"
                  ? "Renter is requested to make the cash payment at the counter upon vehicle collection."
                  : `Online billing via ${b.payment} completed successfully. Present your booking confirmation ID at pickup.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-surface/50">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-full border border-border text-sm font-semibold hover:bg-muted text-ink transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function BookingRow({ b }: { b: Booking }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const { mutate: cancel, isPending } = useMutation({
    mutationFn: () => cancelBooking(b._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast.success("Booking cancelled successfully");
    },
    onError: () => {
      toast.error("Failed to cancel booking");
    },
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-soft hover:shadow-card transition-shadow"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <img
            src={b.vehicleImage}
            alt=""
            className="h-24 w-full md:w-36 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{b.bookingId}</div>
                <Link
                  to="/vehicles/$slug"
                  params={{ slug: b.vehicleSlug }}
                  className="font-display text-lg font-semibold text-ink hover:text-primary truncate block"
                >
                  {b.vehicleName}
                </Link>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap",
                  statusStyle[b.status],
                )}
              >
                {b.status}
              </span>
            </div>
            <div className="mt-2 grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {b.startDate} → {b.endDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {b.pickup}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {b.payment}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Total</span>{" "}
                <span className="font-semibold text-ink">£{b.total.toLocaleString()}</span>{" "}
                <span className="text-xs text-muted-foreground">· {b.days}d</span>
              </div>
              <div className="flex gap-2">
                {b.status === "upcoming" && (
                  <ConfirmModal
                    title="Cancel Booking"
                    description="Are you sure you want to cancel this booking? This action cannot be undone."
                    onConfirm={() => cancel()}
                    confirmText="Cancel Booking"
                  >
                    <button
                      disabled={isPending}
                      className="h-10 px-4 rounded-xl border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 cursor-pointer"
                    >
                      {isPending ? "Cancelling…" : "Cancel"}
                    </button>
                  </ConfirmModal>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="h-8 px-3 inline-flex items-center rounded-full text-xs font-semibold gradient-brand text-white cursor-pointer hover:opacity-90"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showDetails && <BookingDetailsModal b={b} onClose={() => setShowDetails(false)} />}
      </AnimatePresence>
    </>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/60" />
      <div className="mt-3 font-display text-lg font-semibold text-ink">{title}</div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-24 w-36 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-5 w-1/2 bg-muted rounded" />
          <div className="h-3 w-2/3 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
