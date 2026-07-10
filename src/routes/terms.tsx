import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Scale, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — RentalSphere" },
      {
        name: "description",
        content:
          "Terms, rental conditions, renter liability, and safety guidelines for renting with RentalSphere.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "1. Driver Qualifications",
    items: [
      "Minimum Driver Age: 21 years old.",
      "Licenses: A valid national driver's license matching the vehicle category. Foreign drivers must present a valid International Driving Permit (IDP).",
      "Documentation: Passport or national identification card copy is required at check-in.",
    ],
  },
  {
    title: "2. Security Deposit & Payments",
    items: [
      "Refundable Deposits: Security locks are required during checkout and returned within 24 hours of returning the vehicle undamaged.",
      "Fuel Policy: Return the vehicle with the same level of fuel as provided during pickup.",
      "Late Returns: Grace period of 59 minutes applies. Beyond this, hourly extensions or daily rates will be charged.",
    ],
  },
  {
    title: "3. Driving Rules & Restrictions",
    items: [
      "Speed Limits: Standard speed limits are strictly monitored via active GPS tracking. Exceeding 80 km/h will trigger safe driving alerts.",
      "Cross-Border Restriction: Vehicles must not leave the geographical boundaries of the UK.",
      "Prohibited Use: Off-road racing, towing other vehicles, or driving under the influence will void all insurance coverages immediately.",
    ],
  },
];

function TermsPage() {
  return (
    <div className="py-20 md:py-28 bg-surface/30">
      <div className="container-page max-w-4xl space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider"
          >
            <Scale className="h-3.5 w-3.5" /> Legal Agreement
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink"
          >
            Terms of Service
          </motion.h1>
          <p className="text-xs text-muted-foreground">Last updated: May 22, 2026</p>
        </div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Rental Agreement Notice
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please read these terms carefully before scheduling any vehicle booking. By initiating a
            booking on our website, you agree to comply with all standard renter rules and insurance
            liabilities mentioned below.
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-10">
          {sections.map((sect, i) => (
            <motion.div
              key={sect.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="space-y-4"
            >
              <h3 className="font-display text-xl font-bold text-ink">{sect.title}</h3>
              <div className="grid gap-3">
                {sect.items.map((item, index) => (
                  <div key={index} className="flex gap-3 text-sm text-muted-foreground items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-amber-500/5 border border-amber-500/20 p-6 md:p-8 space-y-4"
        >
          <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Off-road Driving Warning
          </h4>
          <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
            Driving premium sedans on off-road terrain or routes beyond standard highways (such as
            dirt paths or river basins) is strictly prohibited. For high-altitude remote trips like
            the Scottish Highlands or rural tracks, you must book 4x4 SUVs or adventure off-road
            bikes.
          </p>
        </motion.div>

        {/* Contact Footer */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            If you have questions or require clarification regarding standard contract conditions,
            feel free to submit a support query.
          </p>
          <Link
            to="/contact"
            className="inline-flex h-11 px-5 items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider gradient-brand text-white shadow-soft hover:-translate-y-0.5 transition-transform self-start sm:self-auto"
          >
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
