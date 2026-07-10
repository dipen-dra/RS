import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Star, MapPin, Fuel, Gauge, Users, Check, ArrowLeft, Calendar, Shield } from "lucide-react";
import { getVehicle, getVehicles } from "@/lib/api";
import { VehicleCard } from "@/components/VehicleCard";

export const Route = createFileRoute("/vehicles/$slug")({
  loader: async ({ params }) => {
    // Loader fetches via the API
    const res = await getVehicle(params.slug).catch(() => null);
    if (!res?.data) throw notFound();
    return { vehicle: res.data };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.vehicle.name} — RentalSphere` },
          { name: "description", content: loaderData.vehicle.description },
          { property: "og:image", content: loaderData.vehicle.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl font-bold">Vehicle not found</h1>
      <Link
        to="/cars"
        className="mt-6 inline-flex h-11 px-6 items-center rounded-full gradient-brand text-white text-sm"
      >
        Browse cars
      </Link>
    </div>
  ),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { vehicle: v } = Route.useLoaderData();
  const [img, setImg] = useState(v.image);

  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("London — Soho hub");

  const days = useMemo(() => {
    if (!pickupDate || !returnDate) return 1;
    const ms = +new Date(returnDate) - +new Date(pickupDate);
    return Math.max(1, Math.ceil(ms / 86400000));
  }, [pickupDate, returnDate]);

  const { data: suggestionsData } = useQuery({
    queryKey: ["vehicles", v.type],
    queryFn: () => getVehicles({ type: v.type }),
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = (suggestionsData?.data ?? []).filter((x) => x._id !== v._id).slice(0, 3);

  return (
    <>
      <section className="container-page pt-10 pb-16">
        <Link
          to={v.type === "car" ? "/cars" : "/bikes"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {v.type === "car" ? "cars" : "bikes"}
        </Link>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-surface shadow-[var(--shadow-card)]">
              <motion.img
                key={img}
                src={img}
                alt={v.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full object-cover"
              />
              <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
                {v.category} · {v.brand}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[v.image, ...v.gallery].slice(0, 4).map((g, i) => (
                <button
                  key={i}
                  onClick={() => setImg(g)}
                  className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${img === g ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {v.brand}
                  </p>
                  <h1 className="mt-1 font-display text-4xl md:text-5xl font-bold tracking-tight">
                    {v.name}
                  </h1>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{" "}
                      <strong>{v.rating}</strong>{" "}
                      <span className="text-muted-foreground">({v.reviews} reviews)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {v.location}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-foreground/80 leading-relaxed">{v.description}</p>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Spec icon={<Fuel className="h-4 w-4" />} label="Fuel" value={v.fuel} />
                <Spec
                  icon={<Gauge className="h-4 w-4" />}
                  label="Transmission"
                  value={v.transmission}
                />
                <Spec
                  icon={<Users className="h-4 w-4" />}
                  label="Capacity"
                  value={`${v.seats} ${v.type === "bike" ? "riders" : "seats"}`}
                />
                <Spec icon={<Shield className="h-4 w-4" />} label="Insurance" value="Included" />
              </div>

              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold mb-4">Features</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {v.features.map((f: string) => (
                    <div
                      key={f}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border/60"
                    >
                      <span className="h-8 w-8 rounded-full gradient-brand text-white inline-flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-28 self-start rounded-3xl border border-border/60 bg-card p-7 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold text-primary">
                £{v.pricePerDay.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/ day</span>
            </div>

            <div className="mt-6 space-y-3">
              <DateField label="Pickup" value={pickupDate} onChange={setPickupDate} />
              <DateField label="Return" value={returnDate} onChange={setReturnDate} />
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pickup location
                </span>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none text-sm font-medium"
                >
                  <option value="London — Soho hub">London (Soho hub)</option>
                  <option value="Edinburgh — Lakeside">Edinburgh (Lakeside)</option>
                  <option value="London — Heathrow Airport">London (Heathrow Airport)</option>
                </select>
              </label>
            </div>

            <div className="mt-6 space-y-2 text-sm">
              <Row
                k={`£${v.pricePerDay.toLocaleString()} × ${days} day${days > 1 ? "s" : ""}`}
                v={`£${(v.pricePerDay * days).toLocaleString()}`}
              />
              <Row
                k="Service fee"
                v={`£${Math.round(v.pricePerDay * days * 0.05).toLocaleString()}`}
              />
              <Row
                k="VAT (20%)"
                v={`£${Math.round(v.pricePerDay * days * 0.2).toLocaleString()}`}
              />
              <div className="pt-3 border-t border-border flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-ink">
                  £{Math.round(v.pricePerDay * days * 1.25).toLocaleString()}
                </span>
              </div>
            </div>

            <Link
              to="/booking/$slug"
              params={{ slug: v.slug }}
              search={{ pickupDate, returnDate, pickupLocation }}
              className="mt-6 w-full h-12 inline-flex items-center justify-center rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-transform"
            >
              Continue to booking
            </Link>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Free cancellation up to 24h before pickup
            </p>
          </motion.aside>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="container-page pb-24">
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-8">You might also like</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s, i) => (
              <VehicleCard key={s._id} v={s} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 border border-border/60">
      <div className="text-primary">{icon}</div>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none text-sm font-medium"
        />
      </div>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{k}</span>
      <span className="text-ink font-medium">{v}</span>
    </div>
  );
}
