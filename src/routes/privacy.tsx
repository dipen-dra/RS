import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Globe, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — RentalSphere" },
      {
        name: "description",
        content:
          "Learn about how we securely store and verify your driver's licenses, booking info, and profile details.",
      },
    ],
  }),
  component: PrivacyPage,
});

const policyPoints = [
  {
    icon: Eye,
    title: "1. Information We Collect",
    desc: "We collect basic profile details (name, email, phone number) when you register. During booking checkouts, we securely process and store your driver's license photos solely to perform mandatory identity and compliance checks as required by vehicle rental laws.",
  },
  {
    icon: Lock,
    title: "2. Data Protection & Security",
    desc: "Your uploaded documents and license photos are encrypted in transit using industry-standard SSL and stored with rest encryption. Only certified fleet officers are authorized to inspect documents, ensuring strict confidentiality.",
  },
  {
    icon: Globe,
    title: "3. Location Telemetry (GPS)",
    desc: "For roadside assistance, mountain safety monitoring, and vehicle protection, our premium cars and bikes are equipped with safe-driving GPS telemetry. We only access real-time location metrics during roadside breakdowns or speed alert occurrences.",
  },
];

function PrivacyPage() {
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
            <Shield className="h-3.5 w-3.5" /> Privacy & Trust
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink"
          >
            Privacy Policy
          </motion.h1>
          <p className="text-xs text-muted-foreground">Last updated: May 22, 2026</p>
        </div>

        {/* Content Points */}
        <div className="space-y-10">
          {policyPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 items-start rounded-3xl border border-border/60 bg-card p-6 md:p-8 hover:shadow-soft transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-ink">{point.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Footer */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Have questions regarding how your driver's license data or profile information is
            handled? Reach out to our privacy officer.
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
