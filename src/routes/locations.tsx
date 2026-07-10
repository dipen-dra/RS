import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Car,
  Bike,
  Search,
  CheckCircle,
  ShieldCheck,
  Clock,
  Navigation,
} from "lucide-react";
import { getVehicles } from "@/lib/api";

import kathmanduImg from "@/assets/kathmandu.png";
import pokharaImg from "@/assets/pokhara.png";
import mustangImg from "@/assets/mustang.png";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — RentalSphere" },
      {
        name: "description",
        content:
          "Rent cars and bikes across the UK. Premium pickups in London, Edinburgh, Highlands, and more.",
      },
    ],
  }),
  component: LocationsPage,
});

interface LocationDetails {
  image: string;
  description: string;
  tagline: string;
  highlights: string[];
}

const locationMeta: Record<string, LocationDetails> = {
  london: {
    image: kathmanduImg,
    tagline: "The UK's Bustling Capital",
    description:
      "Navigate London's iconic landmarks, historic streets, and bustling city centers. Perfect starting point for city touring or business trips.",
    highlights: ["Westminster Abbey", "Tower Bridge", "Easy Airport Pickup"],
  },
  edinburgh: {
    image: pokharaImg,
    tagline: "The Historic Scottish Gateway",
    description:
      "Cruise around Edinburgh's cobblestone streets and stunning castle views. Ideal for travelers, hikers, and city explorers.",
    highlights: ["Edinburgh Castle", "Royal Mile", "Scenic Highlands Portal"],
  },
  highlands: {
    image: mustangImg,
    tagline: "The Wild Mountain Landscapes",
    description:
      "Explore the raw, dramatic scenery of the Scottish Highlands. Ideal for premium 4x4 SUVs or adventure bikes.",
    highlights: ["Loch Ness", "Glen Coe Valley", "Scenic Coastal Drives"],
  },
};

function LocationsPage() {
  const [q, setQ] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["vehicles", "locations"],
    queryFn: () => getVehicles({}),
  });

  const vehicles = res?.data || [];

  const locationCounts = useMemo(() => {
    return vehicles.reduce(
      (acc, v) => {
        const loc = v.location || "London";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [vehicles]);

  const locations = useMemo(() => {
    return Object.entries(locationCounts).map(([name, count]) => {
      const slug = name.toLowerCase();
      const meta = locationMeta[slug] || {
        image: kathmanduImg, // Fallback
        tagline: "Scenic UK Pickup Point",
        description: `Explore and rent premium cars or bikes in ${name}. Safe routes, flexible dropoffs, and complete support.`,
        highlights: ["Flexible pick-ups", "Local safety guide", "All-day assistance"],
      };

      return {
        id: name,
        name,
        count,
        ...meta,
      };
    });
  }, [locationCounts]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => loc.name.toLowerCase().includes(q.toLowerCase()));
  }, [locations, q]);

  return (
    <div className="min-h-screen bg-surface/30 space-y-16 pb-24">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-[oklch(0.12_0.02_260)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="container-page relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider"
          >
            <Navigation className="h-3.5 w-3.5" /> Fleet Hubs
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white"
          >
            Pick Up Across{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              the UK
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto"
          >
            From the bustling capital of London to the historic city of Edinburgh and the dramatic
            roads of the Highlands. Start your drive where it fits your travel plans.
          </motion.p>

          {/* Search bar inside hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md mx-auto pt-4"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search pickup cities..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-primary focus:bg-white/15 transition-all text-sm"
            />
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="container-page max-w-6xl">
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-[2.5rem] bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && filteredLocations.length === 0 && (
          <div className="text-center py-24 rounded-[2.5rem] border border-dashed border-border bg-card">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-ink">
              No pickup hubs match your search
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Try clearing your filters or search for London or Edinburgh.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLocations.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-card border border-border/70 hover:shadow-card hover:border-primary/20 transition-all duration-300"
            >
              <div>
                {/* Image Section with Overlay count */}
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white">
                    <MapPin className="h-3.5 w-3.5" /> {loc.name}
                  </span>
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    {loc.count} {loc.count === 1 ? "vehicle" : "vehicles"}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-6 md:p-8 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {loc.tagline}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-ink mt-1">{loc.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{loc.description}</p>

                  <div className="pt-2 space-y-2 border-t border-border/60">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Local highlights
                    </p>
                    <div className="grid gap-2">
                      {loc.highlights.map((h, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 text-xs text-foreground/80 font-medium"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Booking Actions */}
              <div className="p-6 md:p-8 pt-0 flex gap-3">
                <Link
                  to="/cars"
                  search={{ location: loc.name }}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-full border border-border text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary transition-all"
                >
                  <Car className="h-4 w-4" /> Cars
                </Link>
                <Link
                  to="/bikes"
                  search={{ location: loc.name }}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-full gradient-brand text-white text-xs font-semibold shadow-soft hover:-translate-y-0.5 transition-transform"
                >
                  <Bike className="h-4 w-4" /> Bikes
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="container-page max-w-6xl">
        <div className="rounded-[2.5rem] bg-card border border-border/80 p-8 md:p-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-3xl font-bold text-ink">
              Our Pick up & Drop off Standards
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We make picking up your rental vehicle smooth and secure, anywhere in the UK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Flexible Drop-offs",
                desc: "Pick up in London and drop off in Edinburgh or other major hubs. One-way options are fully customizable.",
              },
              {
                icon: Clock,
                title: "24/7 Roadside Assistance",
                desc: "No matter how remote the route, our network of roadside partners ensures support or replacement is never far away.",
              },
              {
                icon: MapPin,
                title: "Airport Staging",
                desc: "Provide your flight number, and our coordinator will have your car or bike detailed and waiting right outside the terminal.",
              },
            ].map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">{srv.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{srv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
