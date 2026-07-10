import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Phone,
  Mail,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — RentalSphere" },
      {
        name: "description",
        content: "Frequently asked questions and support for renting cars and bikes in the UK.",
      },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    category: "bookings",
    q: "What documents do I need to rent a vehicle?",
    a: "You need a valid driver's license (international driving permit required for foreigners) and a government-issued photo ID (passport for international citizens). The minimum driver age is 21.",
  },
  {
    category: "payments",
    q: "How does the security deposit work?",
    a: "A refundable security deposit (£50 for bikes, £250 for standard SUVs) is pre-authorized on your card or paid via digital wallets during checkouts. It is fully refunded within 24 hours of returning the vehicle safely.",
  },
  {
    category: "insurance",
    q: "Is insurance included in the rental price?",
    a: "Yes, comprehensive third-party insurance comes standard with all rental bookings. You can upgrade to a Premium collision damage waiver (CDW) at checkout to limit maximum personal liability.",
  },
  {
    category: "roadside",
    q: "What should I do in case of an accident or breakdown?",
    a: "Safety first! Ensure everyone is safe. Then, immediately call our 24/7 Roadside Assistance hotline at +44 20 7946 0958. We partner with support mechanics across major UK cities to dispatch roadside support or replacements.",
  },
];

const guides = [
  {
    icon: ShieldCheck,
    title: "Insurance & Coverage",
    desc: "Understand your deductible limits, damage wavers, and emergency liability.",
  },
  {
    icon: CreditCard,
    title: "Refunds & Deposits",
    desc: "Learn about transaction timelines for refundable security locks.",
  },
  {
    icon: Compass,
    title: "Off-road Driving Guide",
    desc: "Best safety guidelines for navigating country lanes and Highlands passes.",
  },
];

function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            <HelpCircle className="h-3.5 w-3.5" /> Support Portal
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink"
          >
            How can we{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              help you?
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            Find answers to frequently asked questions about bookings, insurance policies, refunds,
            and mountain safety guides.
          </motion.p>
        </div>

        {/* Support Grid Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {guides.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-card transition-all"
              >
                <div>
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">{g.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{g.desc}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider cursor-pointer hover:translate-x-0.5 transition-transform">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Get instant answers to general inquiries.
            </p>
          </div>

          <div className="border border-border rounded-3xl bg-card overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="border-b border-border/80 last:border-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/35 transition-colors"
                  >
                    <span className="text-sm font-semibold text-ink">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/20 bg-muted/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-[2.5rem] border border-border bg-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-md">
            <h3 className="font-display text-2xl font-bold text-ink">Still have questions?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are ready to guide you on your journey. Reach out directly to our live support
              channels or submit an query.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/contact"
              className="h-12 px-6 rounded-full gradient-brand text-white font-semibold text-xs uppercase tracking-wider inline-flex items-center justify-center shadow-soft hover:-translate-y-0.5 transition-transform"
            >
              Submit Inquiry <MessageSquare className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="tel:+442079460958"
              className="h-12 px-6 rounded-full border border-border text-ink hover:bg-muted font-semibold text-xs uppercase tracking-wider inline-flex items-center justify-center transition-all"
            >
              Call Hotline <Phone className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
