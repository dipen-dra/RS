import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
  RefreshCw,
} from "lucide-react";
import { useNavigate, Link, useSearch } from "@tanstack/react-router";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ApiError, mfaValidate, getCaptcha } from "@/lib/api";
import { PasswordStrength } from "@/components/PasswordStrength";
import logo from "@/assets/logo.png";
import heroVehicles from "@/assets/hero-vehicles.jpg";

export function AuthCard({
  title,
  subtitle,
  mode,
  footer,
}: {
  title: string;
  subtitle: string;
  mode: "login" | "signup";
  footer: React.ReactNode;
}) {
  const { login, signup, googleSignIn, mfaPending, clearMfaPending, setUser } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { registered?: boolean };
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    search.registered ? "Account created successfully. Please log in." : null,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // CAPTCHA state
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const fetchCaptcha = async () => {
    try {
      const res = await getCaptcha();
      setCaptchaSvg(res.captchaSvg);
      setCaptchaToken(res.captchaToken);
      setCaptchaAnswer("");
    } catch (err) {
      console.error("Failed to load CAPTCHA", err);
    }
  };

  useEffect(() => {
    if (mode === "signup") {
      fetchCaptcha();
    }
  }, [mode]);

  // MFA step state
  const [mfaToken, setMfaToken] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        // If MFA is pending, the auth context has set mfaPending — stay on page
        if ("userId" in result && (result as any).userId) {
          // MFA pending — UI will show TOTP input (handled by mfaPending state)
          return;
        }
        toast.success("Successfully logged in!");
        const user = result as any;
        if (user.role === "superadmin") {
          void navigate({ to: "/superadmin" });
        } else if (user.role === "admin") {
          void navigate({ to: "/admin" });
        } else {
          void navigate({ to: "/dashboard" });
        }
      } else {
        await signup(name, email, password, captchaAnswer, captchaToken);
        toast.success("Account created successfully!");
        void navigate({ to: "/login", search: { registered: true } });
      }
    } catch (err) {
      if (mode === "signup") {
        fetchCaptcha();
      }
      if (err instanceof ApiError) {
        setError(err.errors?.[0]?.msg ?? err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPending) return;
    setMfaLoading(true);
    setError(null);
    try {
      const res = await mfaValidate(mfaPending.userId, mfaToken);
      if (res.user) {
        setUser(res.user);
        clearMfaPending();
        toast.success("Logged in with MFA!");
        if (res.user.role === "superadmin") {
          void navigate({ to: "/superadmin" });
        } else if (res.user.role === "admin") {
          void navigate({ to: "/admin" });
        } else {
          void navigate({ to: "/dashboard" });
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Invalid code. Please try again.");
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    try {
      if (credentialResponse.credential) {
        const user = await googleSignIn(credentialResponse.credential);
        toast.success("Google Sign-In successful!");
        if (user.role === "superadmin") {
          void navigate({ to: "/superadmin" });
        } else if (user.role === "admin") {
          void navigate({ to: "/admin" });
        } else {
          void navigate({ to: "/dashboard" });
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors?.[0]?.msg ?? err.message);
      } else {
        setError("Google authentication failed. Please try again.");
      }
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2 noise-bg">
      <div className="hidden lg:flex relative overflow-hidden items-start justify-center p-12 pt-32">
        <div className="absolute inset-0">
          <img src={heroVehicles} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-brand opacity-90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative text-white max-w-md">
          <span className="inline-flex h-12 w-12 rounded-2xl bg-white/15 backdrop-blur items-center justify-center font-bold text-2xl mb-8">
            R
          </span>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Drive luxury.
            <br />
            Ride freedom.
          </h2>
          <p className="mt-6 text-white/85 leading-relaxed">
            From the Highlands of Scotland to the streets of London, your next adventure starts with
            the right ride.
          </p>
          <div className="mt-12 flex gap-6">
            <Stat k="120+" v="Vehicles" />
            <Stat k="10k+" v="Happy trips" />
            <Stat k="4.9★" v="Avg rating" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <img src={logo} alt="RentalSphere" className="h-8 md:h-10 w-auto" />
            </Link>
            <h1 className="mt-6 font-display text-3xl md:text-4xl font-bold tracking-tight">
              {mfaPending ? "Two-Factor Auth" : title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {mfaPending
                ? "Enter the 6-digit code from your authenticator app"
                : subtitle}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </motion.div>
          )}

          {/* ── MFA Step ────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {mfaPending ? (
              <motion.form
                key="mfa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-8 space-y-5"
                onSubmit={handleMfaSubmit}
              >
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <Field label="Authenticator Code" icon={<ShieldCheck className="h-4 w-4" />}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}|[A-Z0-9]{8}"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value.toUpperCase())}
                    placeholder="000000"
                    required
                    maxLength={8}
                    autoFocus
                    className="w-full bg-transparent text-sm font-mono font-medium tracking-widest focus:outline-none"
                  />
                </Field>

                <p className="text-xs text-muted-foreground text-center">
                  You can also enter an 8-character backup code if you don't have access to your app.
                </p>

                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="w-full h-12 rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {mfaLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    <>
                      Verify Code <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { clearMfaPending(); setError(null); }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" /> Back to login
                </button>
              </motion.form>
            ) : (
              /* ── Normal login/signup form ──────────────── */
              <motion.form
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mt-8 space-y-4"
                onSubmit={handleSubmit}
              >
                {mode === "signup" && (
                  <Field label="Full name" icon={<User className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full bg-transparent text-sm font-medium focus:outline-none"
                    />
                  </Field>
                )}
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="w-full bg-transparent text-sm font-medium focus:outline-none"
                  />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={10}
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
                {mode === "signup" && <PasswordStrength password={password} showRequirements={true} />}

                {mode === "signup" && captchaSvg && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <div
                        className="rounded-xl border border-border bg-white flex items-center justify-center p-1 select-none h-10 w-36 overflow-hidden [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: captchaSvg }}
                      />
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        className="h-10 w-10 flex items-center justify-center border border-border hover:border-primary text-muted-foreground hover:text-primary rounded-xl transition-all"
                        title="Refresh CAPTCHA"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                    <Field label="Enter CAPTCHA Code" icon={<ShieldCheck className="h-4 w-4" />}>
                      <input
                        type="text"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        placeholder="CAPTCHA Answer"
                        required
                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                      />
                    </Field>
                  </div>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="accent-primary" /> Remember me
                    </label>
                    <Link to="/forgot-password" className="text-primary font-medium hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full h-12 rounded-full gradient-brand text-white font-semibold shadow-[var(--shadow-glow)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {mode === "login" ? "Logging in…" : "Creating account…"}
                    </span>
                  ) : (
                    <>
                      {mode === "login" ? "Log in" : "Create account"}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" /> or continue with{" "}
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex justify-center mt-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google authentication failed.")}
                    useOneTap
                    theme="outline"
                    shape="pill"
                    size="large"
                    text={mode === "login" ? "signin_with" : "signup_with"}
                  />
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-sm text-center text-muted-foreground">{footer}</p>
        </motion.div>
      </div>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-center gap-3 h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold">{k}</p>
      <p className="text-xs text-white/70 mt-1">{v}</p>
    </div>
  );
}
