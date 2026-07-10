import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Fuel, Gauge, Users, Star } from "lucide-react";
import type { Vehicle } from "@/lib/api";

export function VehicleCard({ v, index = 0 }: { v: Vehicle; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group rounded-3xl bg-card border border-border/70 overflow-hidden card-hover"
    >
      <Link to="/vehicles/$slug" params={{ slug: v.slug }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <img
            src={v.image}
            alt={v.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full glass px-3 py-1 text-xs font-medium text-ink">
            {v.category}
          </span>
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-ink/80 backdrop-blur-md text-white px-3 py-1 text-xs font-semibold">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {v.rating}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{v.brand}</p>
              <h3 className="font-display text-lg font-semibold text-ink mt-0.5">{v.name}</h3>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-primary">
                £{v.pricePerDay.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground">/ day</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" /> {v.fuel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> {v.transmission}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {v.seats}
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <span className="flex-1 inline-flex items-center justify-center h-10 rounded-full border border-border text-xs font-medium text-foreground/80 group-hover:border-primary group-hover:text-primary transition-colors">
              View details
            </span>
            <span className="inline-flex items-center justify-center h-10 px-5 rounded-full gradient-brand text-white text-xs font-semibold shadow-[var(--shadow-glow)]">
              Book now
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
