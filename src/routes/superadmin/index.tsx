import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/superadmin/")({
  loader: () => { throw redirect({ to: "/superadmin/overview" }); },
});
