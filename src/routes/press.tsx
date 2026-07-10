import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Newspaper,
  Download,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press & Media Kit — RentalSphere" },
      {
        name: "description",
        content: "Latest press releases, media kits, and brand assets for RentalSphere.",
      },
    ],
  }),
  component: PressPage,
});

const articles = [
  {
    title: "RentalSphere Expands Premium SUV Rental Fleet to Edinburgh & Highlands",
    date: "April 15, 2026",
    outlet: "The Guardian",
    summary:
      "Introducing comprehensive overland solutions with professional support for remote Highlands routes to improve adventure travel experiences in the UK.",
  },
  {
    title: "RentalSphere launches the UK's first fully digital luxury vehicle rental service",
    date: "January 20, 2026",
    outlet: "TechCrunch UK",
    summary:
      "A seamless booking application featuring instant validation, live availability trackers, and flexible digital checkouts.",
  },
];

const brandAssets = [
  {
    name: "Logo Pack (SVG & PNG)",
    size: "4.2 MB",
    desc: "Includes light, dark, and icon-only high resolution logo files.",
  },
  {
    name: "Brand Guidelines (PDF)",
    size: "12.8 MB",
    desc: "Hex color codes, typography scales, and correct usage guides.",
  },
];

function PressPage() {
  return (
    <div className="py-20 md:py-28 bg-surface/30">
      <div className="container-page max-w-5xl space-y-20">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider"
          >
            <Newspaper className="h-3.5 w-3.5" /> Media Relations
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink"
          >
            Press Room &{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Brand Assets
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            Welcome to the RentalSphere press room. Find our latest announcements, news coverages,
            and download high-quality, approved brand assets.
          </motion.p>
        </div>

        {/* Latest Releases */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Recent Press Releases</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Read our latest company announcements and milestones.
            </p>
          </div>
          <div className="grid gap-6">
            {articles.map((art, i) => (
              <motion.div
                key={art.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl border border-border/60 bg-card p-6 md:p-8 hover:border-primary/20 hover:shadow-card transition-all duration-300"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {art.date}
                  </span>
                  <span className="font-semibold text-primary uppercase tracking-wide bg-primary/5 px-2.5 py-0.5 rounded-full">
                    {art.outlet}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-ink group-hover:text-primary transition-colors duration-300 mt-4">
                  {art.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{art.summary}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  Read Full Article <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Media Kit Assets */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Brand Assets</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Approved logos, screenshots, and visual specs for media use.
              </p>
            </div>
            <div className="space-y-4">
              {brandAssets.map((asset, i) => (
                <div
                  key={asset.name}
                  className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{asset.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{asset.desc}</p>
                    <span className="inline-block text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-2">
                      {asset.size}
                    </span>
                  </div>
                  <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Media & PR Inquiries</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get in touch with our communications team for interviews or data requests.
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold text-ink">press@rentalsphere.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-semibold text-ink">+44 20 7946 0958 (Ext. 402)</p>
                </div>
              </div>
            </div>

            <Link
              to="/contact"
              className="w-full h-11 rounded-full gradient-brand text-white font-semibold text-xs uppercase tracking-wider inline-flex items-center justify-center shadow-soft hover:-translate-y-0.5 transition-transform"
            >
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
