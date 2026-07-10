import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, ApiError } from "@/lib/api";
import { PasswordStrength, validatePasswordStrength } from "@/components/PasswordStrength";

type Search = { token?: string; email?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password — RentalSphere" },
      { name: "description", content: "Choose a new password for your RentalSphere account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { email, token } = Route.useSearch();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => validatePasswordStrength(pw), [pw]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) {
      toast.error("Missing verification token or email. Please restart the reset process.");
      return;
    }
    if (!validation.isValid) {
      toast.error("Password does not meet security requirements.");
      return;
    }
    if (pw !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, token, pw);
      toast.success("Password updated. Please log in with your new password.");
      void navigate({ to: "/login" });
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
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="relative text-white max-w-md">
          <span className="inline-flex h-12 w-12 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-8">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Create a new password
          </h2>
          <p className="mt-6 text-white/85 leading-relaxed">
            Pick something strong and unique. We'll sign you out from all devices for safety.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-2 text-muted-foreground">
            {email ? (
              <>
                For <span className="font-medium text-foreground">{email}</span>
              </>
            ) : (
              "Choose a password you'll remember."
            )}
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Field label="New password">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                required
                minLength={10}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            <PasswordStrength password={pw} showRequirements={true} />

            <Field label="Confirm password">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
              />
            </Field>

            {confirm && pw !== confirm && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}

            <button
              disabled={loading || !validation.isValid || pw !== confirm || !pw}
              className="mt-4 w-full h-12 rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Updating..." : "Update password"} <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Back to{" "}
            <Link to="/login" className="text-primary font-semibold">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-center gap-3 h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
        {children}
      </span>
    </label>
  );
}
