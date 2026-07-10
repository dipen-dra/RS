import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { redirectIfLoggedIn } from "@/lib/guards";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — RentalSphere" }] }),
  beforeLoad: redirectIfLoggedIn,
  component: () => (
    <AuthCard
      title="Create your account"
      subtitle="Join thousands of drivers exploring the UK."
      mode="signup"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </>
      }
    />
  ),
});
