import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Cookie, Check, ShieldAlert, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies Policy — RentalSphere" },
      {
        name: "description",
        content:
          "Details on how RentalSphere uses cookies to manage booking checkouts, security sessions, and preferences.",
      },
    ],
  }),
  component: CookiesPage,
});

const cookieTypes = [
  {
    title: "Essential Cookies",
    desc: "Necessary to keep your authentication session active, retrieve your shopping carts during checkouts, and maintain security tokens.",
    status: "Always Active",
  },
  {
    title: "Analytical & Performance",
    desc: "Allows us to measure search filter loads, identify slower page routes, and optimize image render speeds across our fleet catalogs.",
    status: "Optional",
  },
  {
    title: "Preferences Cookies",
    desc: "Used to preserve local site configurations such as dark mode preferences and city search filter presets.",
    status: "Optional",
  },
];

function CookiesPage() {
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
            <Cookie className="h-3.5 w-3.5" /> Tracker Management
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink"
          >
            Cookies Policy
          </motion.h1>
          <p className="text-xs text-muted-foreground">Last updated: May 22, 2026</p>
        </div>

        {/* Intro */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground leading-relaxed bg-card border border-border p-6 rounded-3xl"
        >
          We use cookies and active web storage techniques to deliver a faster, personalized, and
          secure booking experience. This document outlines the types of tracking technologies
          utilized by our client and backend servers.
        </motion.p>

        {/* Cookie Table/List */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-ink">Cookies We Utilize</h2>
          <div className="grid gap-4">
            {cookieTypes.map((cookie, i) => (
              <motion.div
                key={cookie.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-soft transition-all duration-300"
              >
                <div className="space-y-1.5 max-w-xl">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> {cookie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cookie.desc}</p>
                </div>
                <span className="inline-flex h-8 px-4 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 self-start sm:self-auto">
                  <Check className="h-3 w-3 mr-1" /> {cookie.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-primary/5 border border-primary/20 p-6 md:p-8 flex gap-4 items-start"
        >
          <ShieldAlert className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Removing or blocking functional session cookies via browser controls might cause active
            auth states to reset, booking selections to clear, and dashboard maps to display with
            errors.
          </p>
        </motion.div>

        {/* Contact Footer */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            If you wish to opt-out of optional analytics tracking or have questions about local web
            storage, submit an inquiry.
          </p>
          <Link
            to="/contact"
            className="inline-flex h-11 px-5 items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider gradient-brand text-white shadow-soft hover:-translate-y-0.5 transition-transform self-start sm:sm:self-auto"
          >
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
