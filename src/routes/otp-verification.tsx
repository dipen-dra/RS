import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { verifyOtp, forgotPassword, ApiError } from "@/lib/api";

type Search = { email?: string };

export const Route = createFileRoute("/otp-verification")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify OTP — RentalSphere" },
      { name: "description", content: "Enter the 6-digit verification code sent to your email." },
    ],
  }),
  component: OtpPage,
});

function OtpPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is missing. Please restart the process.");
      return;
    }
    const code = digits.join("");
    if (code.length < 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(email, code);
      toast.success("Code verified.");
      void navigate({ to: "/reset-password", search: { token: code, email } });
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

  const resend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      toast.error("Email is missing. Please restart the process.");
      return;
    }

    try {
      setCooldown(45);
      await forgotPassword(email);
      toast.success("A new code has been sent.");
    } catch (err) {
      setCooldown(0); // reset cooldown if it failed
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2 noise-bg">
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 gradient-brand opacity-95" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="relative text-white max-w-md">
          <span className="inline-flex h-12 w-12 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-8">
            <KeyRound className="h-6 w-6" />
          </span>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Check your inbox
          </h2>
          <p className="mt-6 text-white/85 leading-relaxed">
            We sent a 6-digit code to {email ? <strong>{email}</strong> : "your email"}. It expires
            in 10 minutes.
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
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Change email
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Enter verification code
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sent to <span className="font-medium text-foreground">{email ?? "your email"}</span>
          </p>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="flex gap-2 sm:gap-3 justify-between" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setAt(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl bg-muted border-2 border-border focus:border-primary focus:bg-background focus:outline-none transition-colors text-ink"
                />
              ))}
            </div>

            <button
              disabled={loading}
              className="w-full h-12 rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Verifying..." : "Verify code"} <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                void resend();
              }}
              disabled={cooldown > 0}
              className="w-full inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
