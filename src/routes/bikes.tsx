import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";

export const Route = createFileRoute("/bikes")({
  head: () => ({
    meta: [
      { title: "Rent a Bike — RentalSphere" },
      {
        name: "description",
        content: "Adventure, sports, cruiser, and scooter rentals across the UK.",
      },
    ],
  }),
  component: () => (
    <CatalogPage
      type="bike"
      title="Rent a Bike"
      subtitle="Conquer the Highlands or weave the city — your ride awaits."
    />
  ),
});
