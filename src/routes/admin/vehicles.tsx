import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, type Vehicle } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vehicles")({
  component: VehiclesTab,
});

function VehiclesTab() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => getVehicles({}),
  });
  const vehicles = (data?.data ?? []).filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle deleted successfully");
    },
    onError: () => toast.error("Failed to delete vehicle"),
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vehicles…"
            className="w-full h-10 pl-10 pr-4 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => {
            setEditVehicle(null);
            setShowModal(true);
          }}
          className="h-10 px-5 inline-flex items-center gap-2 rounded-full gradient-brand text-white text-sm font-medium shadow-[var(--shadow-glow)]"
        >
          <Plus className="h-4 w-4" /> Add vehicle
        </button>
      </div>

      {showModal && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(
              editVehicle ? "Vehicle updated successfully" : "Vehicle created successfully",
            );
          }}
        />
      )}

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading vehicles…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Price / day</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v._id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                      <div>
                        <div className="font-medium text-ink">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize">
                    {v.type} · {v.category}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">
                    £{v.pricePerDay.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">{v.location}</td>
                  <td className="px-5 py-3">
                    {v.rating} ★{" "}
                    <span className="text-xs text-muted-foreground">({v.reviews})</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditVehicle(v);
                          setShowModal(true);
                        }}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <ConfirmModal
                        title="Delete Vehicle"
                        description={`Are you sure you want to delete ${v.name}? This action cannot be undone.`}
                        onConfirm={() => doDelete(v._id)}
                        confirmText="Delete"
                      >
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </ConfirmModal>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function VehicleModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    slug: vehicle?.slug ?? "",
    name: vehicle?.name ?? "",
    brand: vehicle?.brand ?? "",
    type: vehicle?.type ?? "car",
    category: vehicle?.category ?? "",
    pricePerDay: vehicle?.pricePerDay ?? 0,
    fuel: vehicle?.fuel ?? "Petrol",
    transmission: vehicle?.transmission ?? "Automatic",
    seats: vehicle?.seats ?? 5,
    location: vehicle?.location ?? "London",
    description: vehicle?.description ?? "",
    features: vehicle?.features?.join(", ") ?? "",
    isAvailable: vehicle?.isAvailable ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (!isEdit) {
        throw new Error("Main image is required");
      }
      galleryFiles.forEach((file) => {
        formData.append("gallery", file);
      });

      return isEdit ? updateVehicle(vehicle!._id, formData) : createVehicle(formData);
    },
    onSuccess: onSaved,
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const F = ({
    label,
    k,
    type = "text",
  }: {
    label: string;
    k: keyof typeof form;
    type?: string;
  }) => (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={String(form[k])}
        onChange={(e) => setForm((d) => ({ ...d, [k]: e.target.value }))}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-ink">
            {isEdit ? "Edit vehicle" : "Add vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <p className="mb-4 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Slug" k="slug" />
          <F label="Name" k="name" />
          <F label="Brand" k="brand" />
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((d) => ({ ...d, type: e.target.value as "car" | "bike" }))}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </label>
          <F label="Category" k="category" />
          <F label="Price per day (GBP)" k="pricePerDay" type="number" />
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Fuel</span>
            <select
              value={form.fuel}
              onChange={(e) => setForm((d) => ({ ...d, fuel: e.target.value as Vehicle["fuel"] }))}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
            >
              {["Petrol", "Diesel", "Electric", "Hybrid"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Transmission
            </span>
            <select
              value={form.transmission}
              onChange={(e) =>
                setForm((d) => ({ ...d, transmission: e.target.value as Vehicle["transmission"] }))
              }
              className="mt-1 w-full h-10 px-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
            >
              <option>Automatic</option>
              <option>Manual</option>
            </select>
          </label>
          <F label="Seats" k="seats" type="number" />
          <F label="Location" k="location" />
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Main Image {isEdit && "(Leave blank to keep current)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Gallery Images (Up to 5)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                className="mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <F label="Features (comma-separated)" k="features" />
          </div>
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm resize-none"
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-full border border-border text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="h-10 px-5 rounded-full gradient-brand text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
