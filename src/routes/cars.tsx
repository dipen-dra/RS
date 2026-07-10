import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "Rent a Car — RentalSphere" },
      {
        name: "description",
        content:
          "Browse premium cars for rent across the UK — economy, SUV, luxury, sports, and electric.",
      },
    ],
  }),
  component: () => (
    <CatalogPage
      type="car"
      title="Rent a Car"
      subtitle="From efficient economy to electric and exotic — find your perfect drive."
    />
  ),
});
