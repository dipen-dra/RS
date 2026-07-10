import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVehicles, type VehicleType, type Vehicle } from "@/lib/api";
import { VehicleCard } from "./VehicleCard";
import { useSearch, Link } from "@tanstack/react-router";

type Sort = "popular" | "price-asc" | "price-desc" | "rating";

export function CatalogPage({
  type,
  title,
  subtitle,
}: {
  type: VehicleType;
  title: string;
  subtitle: string;
}) {
  const search = useSearch({ strict: false }) as { location?: string };
  const activeLocation = search.location || "";

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<Sort>("popular");
  const [priceMax, setPriceMax] = useState<number>(99999);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", type],
    queryFn: () => getVehicles({ type }),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const all: Vehicle[] = data?.data ?? [];
  const categories = ["All", ...Array.from(new Set(all.map((v) => v.category)))];
  const locationsList = ["All", ...Array.from(new Set(all.map((v) => v.location || "London")))];
  const maxPrice = all.length ? Math.max(...all.map((v) => v.pricePerDay)) : 99999;

  const list = useMemo(() => {
    let r = all.filter(
      (v) =>
        (cat === "All" || v.category === cat) &&
        v.pricePerDay <= (priceMax === 99999 ? maxPrice : priceMax) &&
        (q === "" || (v.name + v.brand).toLowerCase().includes(q.toLowerCase())) &&
        (activeLocation === "" ||
          (v.location || "").toLowerCase() === activeLocation.toLowerCase()),
    );
    if (sort === "price-asc") r = [...r].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    return r;
  }, [all, cat, priceMax, q, sort, maxPrice, activeLocation]);

  return (
    <>
      <section className="noise-bg">
        <div className="container-page pt-16 pb-12 md:pt-24 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              {type === "car" ? "Cars" : "Bikes"}
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight">{title}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-28 self-start rounded-3xl border border-border/60 bg-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-ink">Filters</h3>
              </div>
              {activeLocation && (
                <Link
                  to="."
                  search={(prev: any) => ({ ...prev, location: undefined })}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  Clear location
                </Link>
              )}
            </div>

            {activeLocation && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-primary font-medium">
                <span className="flex-1 truncate">
                  Location: <span className="font-bold">{activeLocation}</span>
                </span>
                <Link
                  to="."
                  search={(prev: any) => ({ ...prev, location: undefined })}
                  className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                </Link>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name…"
                className="w-full h-11 pl-9 pr-3 rounded-full bg-muted border border-transparent focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`h-9 px-4 rounded-full text-xs font-medium border transition-all ${cat === c ? "gradient-brand text-white border-transparent shadow-[var(--shadow-glow)]" : "bg-background border-border hover:border-primary/40"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Location Hubs
              </p>
              <div className="flex flex-wrap gap-2">
                {locationsList.map((loc) => {
                  const isActive =
                    (loc === "All" && !activeLocation) ||
                    activeLocation.toLowerCase() === loc.toLowerCase();
                  return (
                    <Link
                      key={loc}
                      to="."
                      search={(prev: any) => ({
                        ...prev,
                        location: loc === "All" ? undefined : loc,
                      })}
                      className={`h-9 px-4 inline-flex items-center rounded-full text-xs font-medium border transition-all ${isActive ? "gradient-brand text-white border-transparent shadow-[var(--shadow-glow)]" : "bg-background border-border hover:border-primary/40"}`}
                    >
                      {loc}
                    </Link>
                  );
                })}
              </div>
            </div>

            {all.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Max price{" "}
                  <span className="text-ink font-semibold ml-1">
                    £{(priceMax === 99999 ? maxPrice : priceMax).toLocaleString()}
                  </span>
                </p>
                <input
                  type="range"
                  min={Math.min(...all.map((v) => v.pricePerDay))}
                  max={maxPrice}
                  step={5}
                  value={priceMax === 99999 ? maxPrice : priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </aside>

          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${list.length} vehicles`}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 px-4 rounded-full bg-muted border border-transparent text-sm font-medium focus:outline-none focus:border-primary"
              >
                <option value="popular">Most popular</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-5 w-2/3 bg-muted rounded" />
                      <div className="h-4 w-1/3 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-24 rounded-3xl bg-surface border border-border/60">
                <p className="font-display text-lg font-semibold">No vehicles match your filters</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try widening the price range or category.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {list.map((v, i) => (
                  <VehicleCard key={v._id} v={v} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
