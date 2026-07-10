import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPassword, ApiError } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — RentalSphere" },
      { name: "description", content: "Reset your RentalSphere account password securely." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      toast.success("OTP sent to your email.");
      void navigate({ to: "/otp-verification", search: { email } });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2 noise-bg">
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 gradient-brand opacity-95" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative text-white max-w-md">
          <span className="inline-flex h-12 w-12 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-8">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Forgot password?
            <br />
            We've got you.
          </h2>
          <p className="mt-6 text-white/85 leading-relaxed">
            Enter the email you signed up with and we'll send a 6-digit verification code to
            securely reset your password.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-muted-foreground">We'll send a one-time code to your inbox.</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <span className="mt-1 flex items-center gap-3 h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-transparent text-sm font-medium focus:outline-none"
                />
              </span>
            </label>

            <button
              disabled={loading}
              className="mt-2 w-full h-12 rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Sending code..." : "Send verification code"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
