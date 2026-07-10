import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Car,
  Bike,
  ShieldCheck,
  Clock,
  Tag,
  CreditCard,
  Zap,
  BadgeCheck,
  ChevronDown,
  Star,
  Quote,
} from "lucide-react";
import heroImg from "@/assets/hero-vehicles.jpg";
import { getVehicles, type Vehicle } from "@/lib/api";
import { VehicleCard } from "@/components/VehicleCard";

// Keep testimonials & FAQs as static marketing content
const testimonials = [
  {
    name: "John Doe",
    role: "Traveler, London",
    text: "Booked a Land Rover for a Highlands trip — flawless from start to finish. The vehicle was spotless.",
    rating: 5,
  },
  {
    name: "Sarah Jenkins",
    role: "Designer, Edinburgh",
    text: "Rented a Tesla for a weekend. The handover was 5 minutes. Felt like Apple-level service.",
    rating: 5,
  },
  {
    name: "Brian Thomas",
    role: "Founder, Manchester",
    text: "Used RentalSphere twice for client visits. Professional, on-time, and the pricing is honest.",
    rating: 5,
  },
  {
    name: "Patricia Smith",
    role: "Photographer, Birmingham",
    text: "Loved the booking flow. Picked the SUV, paid via Card, done. Zero friction.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "What documents do I need to rent?",
    a: "A valid driving license, passport or ID card, and one of: Credit/Debit Card, PayPal, or cash deposit at pickup.",
  },
  {
    q: "Is there a security deposit?",
    a: "Yes. Refundable deposits range from £50 to £250 depending on the vehicle category, returned within 24 hours of drop-off.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Free cancellation up to 24 hours before pickup. After that, a 20% fee applies.",
  },
  {
    q: "Do you offer delivery?",
    a: "Inside London and Edinburgh, we deliver free for bookings of 3+ days.",
  },
  {
    q: "What if the vehicle breaks down?",
    a: "Our 24/7 roadside team will reach you within 90 minutes anywhere on a main highway in the UK.",
  },
];

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <>
      <Hero />
      <PopularVehicles />
      <WhyUs />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden noise-bg">
      <div className="absolute inset-0 -z-10">
        <motion.div
          aria-hidden
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-[oklch(0.81_0.08_254)]/30 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container-page pt-12 md:pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-ink"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now serving 6 cities across the UK
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
          >
            Premium <span className="text-gradient">Car & Bike</span> Rentals Across the UK
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl"
          >
            Rent luxury cars, bikes, and travel companions for the road. Instant booking,
            transparent pricing, and zero hidden fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/cars"
              className="inline-flex h-12 items-center px-7 rounded-full gradient-brand text-white font-medium shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:shadow-xl transition-all"
            >
              Book Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/bikes"
              className="inline-flex h-12 items-center px-7 rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors"
            >
              Explore Fleet
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 grid grid-cols-3 gap-6 max-w-md"
          >
            {[
              { k: "120+", v: "Vehicles" },
              { k: "10k+", v: "Trips" },
              { k: "4.9★", v: "Rating" },
            ].map((s) => (
              <div key={s.v}>
                <p className="font-display text-2xl font-bold text-ink">{s.k}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.v}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="lg:col-span-6 relative"
        >
          <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_40px_120px_-30px_rgb(93_139_244_/_0.45)]">
            <img
              src={heroImg}
              alt="Luxury car and bike"
              width={1600}
              height={1200}
              className="h-full w-full object-cover"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute -left-4 md:-left-8 top-10 glass rounded-2xl p-4 shadow-[var(--shadow-card)] w-56"
          >
            <p className="text-xs text-muted-foreground">Today's pick</p>
            <p className="font-display font-semibold text-ink mt-1">Tesla Model 3</p>
            <p className="text-primary font-bold mt-1">
              £125 <span className="text-xs font-normal text-muted-foreground">/day</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="absolute -right-4 md:-right-6 bottom-8 glass rounded-2xl p-4 shadow-[var(--shadow-card)] flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-full gradient-brand flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insured & verified</p>
              <p className="text-sm font-semibold text-ink">100% safe rides</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <SearchBar />
    </section>
  );
}

/* ---------------- SEARCH ---------------- */
function SearchBar() {
  return (
    <div className="container-page -mt-8 md:-mt-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl md:rounded-full glass shadow-[var(--shadow-card)] p-3 grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 md:gap-1 items-center"
      >
        <Field icon={<MapPin className="h-4 w-4" />} label="Pickup">
          <select className="bg-transparent text-sm font-medium text-ink focus:outline-none w-full">
            <option>London</option>
            <option>Edinburgh</option>
            <option>Manchester</option>
            <option>Birmingham</option>
            <option>Leeds</option>
            <option>Bristol</option>
          </select>
        </Field>
        <Field icon={<Calendar className="h-4 w-4" />} label="Pickup date">
          <input
            type="date"
            className="bg-transparent text-sm font-medium text-ink focus:outline-none w-full"
          />
        </Field>
        <Field icon={<Calendar className="h-4 w-4" />} label="Return date">
          <input
            type="date"
            className="bg-transparent text-sm font-medium text-ink focus:outline-none w-full"
          />
        </Field>
        <Field icon={<Car className="h-4 w-4" />} label="Vehicle">
          <select className="bg-transparent text-sm font-medium text-ink focus:outline-none w-full">
            <option>Any</option>
            <option>Car</option>
            <option>Bike</option>
          </select>
        </Field>
        <Link
          to="/cars"
          className="h-12 md:h-14 px-6 inline-flex items-center justify-center rounded-full gradient-brand text-white font-medium shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-all"
        >
          Search <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-2 md:py-3 rounded-xl md:rounded-full hover:bg-muted/60 cursor-pointer transition-colors">
      <span className="h-9 w-9 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex flex-col min-w-0 w-full">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {children}
      </span>
    </label>
  );
}

/* ---------------- POPULAR ---------------- */
function PopularVehicles() {
  const [tab, setTab] = useState<"all" | "car" | "bike">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", "home"],
    queryFn: () => getVehicles({}),
    staleTime: 5 * 60 * 1000,
  });
  const allVehicles: Vehicle[] = data?.data ?? [];
  const list = allVehicles.filter((v) => tab === "all" || v.type === tab).slice(0, 6);
  return (
    <section className="container-page py-24 md:py-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Popular fleet
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Pick your next ride
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl">
            A handpicked selection of our most-booked vehicles this month.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-muted p-1">
          {(
            [
              { k: "all", label: "All", icon: null },
              { k: "car", label: "Cars", icon: <Car className="h-3.5 w-3.5" /> },
              { k: "bike", label: "Bikes", icon: <Bike className="h-3.5 w-3.5" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "relative h-10 px-5 inline-flex items-center gap-2 rounded-full text-sm font-medium transition-colors",
                tab === t.k ? "text-primary" : "text-foreground/70 hover:text-foreground",
              )}
            >
              {tab === t.k && (
                <motion.span
                  layoutId="pop-tab"
                  className="absolute inset-0 rounded-full bg-primary/10 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/10] bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-1/3 bg-muted rounded" />
                <div className="h-5 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No vehicles found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((v, i) => (
            <VehicleCard key={v._id} v={v} index={i} />
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Link
          to="/cars"
          className="inline-flex h-12 px-7 items-center rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors"
        >
          See all vehicles <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ---------------- WHY US ---------------- */
function WhyUs() {
  const items = [
    { icon: Tag, title: "Affordable pricing", text: "Transparent rates, no hidden fees, ever." },
    {
      icon: BadgeCheck,
      title: "Verified vehicles",
      text: "Every car and bike is inspected before pickup.",
    },
    { icon: Clock, title: "24/7 support", text: "Our team is one call away, day or night." },
    { icon: Calendar, title: "Flexible booking", text: "Free cancellation up to 24 hours." },
    { icon: Zap, title: "Instant booking", text: "From browse to keys in under 3 minutes." },
    {
      icon: CreditCard,
      title: "Safe payments",
      text: "Credit/Debit Card, PayPal, or cash on pickup.",
    },
  ];
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Why RentalSphere
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Built for travelers who care
          </h2>
          <p className="mt-4 text-muted-foreground">
            From the lowlands to the Scottish Highlands, we sweat the details so your trip is
            effortless.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-3xl bg-card p-7 border border-border/60 card-hover"
            >
              <div className="h-12 w-12 rounded-2xl gradient-brand text-white inline-flex items-center justify-center shadow-[var(--shadow-glow)]">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  return (
    <section className="container-page py-24 md:py-32">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">
          Loved across the UK
        </p>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">What our drivers say</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-3xl border border-border/60 bg-card p-7 card-hover"
          >
            <Quote className="h-7 w-7 text-primary/30" />
            <p className="mt-4 text-sm leading-relaxed text-foreground">"{t.text}"</p>
            <div className="mt-6 flex items-center gap-3 pt-5 border-t border-border/60">
              <div className="h-10 w-10 rounded-full gradient-brand text-white font-semibold inline-flex items-center justify-center">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">{t.role}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="container-page grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">FAQ</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Questions, answered
          </h2>
          <p className="mt-4 text-muted-foreground">
            Can't find what you're looking for?{" "}
            <Link to="/contact" className="text-primary font-medium">
              Talk to us →
            </Link>
          </p>
        </div>
        <div className="lg:col-span-7 space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card border border-border/60 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-ink">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${open === i ? "rotate-180 text-primary" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  return (
    <section className="container-page py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[2.5rem] gradient-brand p-12 md:p-20 text-white"
      >
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
              Your next adventure is one tap away.
            </h2>
            <p className="mt-4 text-white/85 max-w-md">
              Browse 120+ vehicles, lock in pickup, and hit the road today.
            </p>
          </div>
          <div className="md:justify-self-end flex flex-wrap gap-3">
            <Link
              to="/cars"
              className="h-12 px-7 inline-flex items-center rounded-full bg-white text-primary font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Browse cars
            </Link>
            <Link
              to="/bikes"
              className="h-12 px-7 inline-flex items-center rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-medium hover:bg-white/20 transition-colors"
            >
              Browse bikes
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
