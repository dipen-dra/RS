import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  Star,
  Heart,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — RentalSphere" },
      {
        name: "description",
        content: "Join our team at RentalSphere. Build the future of premium car and bike rentals.",
      },
    ],
  }),
  component: CareersPage,
});

const jobs = [
  {
    title: "Highlands Fleet Manager",
    department: "Operations",
    location: "Edinburgh / Highlands",
    type: "Full-Time",
    salary: "£2,500 - £3,500 / month",
    icon: Compass,
    description:
      "Lead the inspection, maintenance, and staging of premium SUVs and adventure bikes for off-road Scottish Highlands expeditions.",
  },
  {
    title: "Full Stack Software Engineer",
    department: "Engineering",
    location: "London (Hybrid)",
    type: "Full-Time",
    salary: "£4,500 - £6,000 / month",
    icon: Sparkles,
    description:
      "Scale our booking system, enhance the admin dashboard tools, and build intelligent routing logic for vehicle deliveries.",
  },
  {
    title: "Customer Success Lead",
    department: "Support",
    location: "London (Soho)",
    type: "Full-Time",
    salary: "£2,000 - £2,800 / month",
    icon: Heart,
    description:
      "Provide exceptional, premium booking coordination and emergency road assistance support to international and local travelers.",
  },
];

const perks = [
  {
    icon: Heart,
    title: "Health & Wellbeing",
    desc: "Comprehensive medical insurance and mental wellness allowances for you and your family.",
  },
  {
    icon: Compass,
    title: "Road Trips & Rentals",
    desc: "Free quarterly luxury vehicle rentals and sponsored team road-trips across the UK.",
  },
  {
    icon: Star,
    title: "Equity & Performance",
    desc: "Annual performance bonuses, stock options, and ongoing learning stipends.",
  },
];

function CareersPage() {
  return (
    <div className="py-20 md:py-28 bg-surface/30">
      <div className="container-page max-w-6xl space-y-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider"
          >
            <Briefcase className="h-3.5 w-3.5" /> Join Our Fleet
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-bold tracking-tight text-ink"
          >
            Build the future of travel <br />
            <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              in the UK
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            We are looking for builders, adventure seekers, and problem solvers to help us redefine
            premium transportation and travel experiences in the UK.
          </motion.p>
        </div>

        {/* Perks Section */}
        <div className="space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-ink">Perks of the Road</h2>
            <p className="text-sm text-muted-foreground mt-2">
              What you receive when you join the RentalSphere family.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl border border-border/60 bg-card p-8 hover:border-primary/30 hover:shadow-card hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Open Roles Section */}
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-ink">Open Opportunities</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our current roles and join us on our journey.
              </p>
            </div>
            <span className="text-xs font-bold text-primary uppercase bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 self-start md:self-auto">
              {jobs.length} Active Positions
            </span>
          </div>

          <div className="grid gap-6">
            {jobs.map((job, i) => {
              const Icon = job.icon;
              return (
                <motion.div
                  key={job.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-3xl border border-border/60 bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display text-xl font-bold text-ink group-hover:text-primary transition-colors duration-300">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> {job.salary}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex h-11 px-5 items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-muted text-ink group-hover:bg-primary group-hover:text-white transition-all self-start md:self-auto"
                  >
                    Apply Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] gradient-brand p-8 md:p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
              Don't see the perfect role?
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              We are always looking for exceptional talent who love cars, bikes, and hospitality.
              Drop us an open application query via our contact center!
            </p>
            <Link
              to="/contact"
              className="inline-flex h-12 px-6 items-center gap-2 rounded-full bg-white text-primary font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform"
            >
              Get In Touch <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
