import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
  KeyRound,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { mfaSetup, mfaConfirm, mfaDisable, mfaStatus } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/mfa")({
  component: MfaSetupPage,
});

type Step = "status" | "scan" | "confirm" | "backup" | "disable";

function MfaSetupPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("status");
  const [qrData, setQrData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [totp, setTotp] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: statusData, refetch } = useQuery({
    queryKey: ["mfa-status"],
    queryFn: mfaStatus,
  });

  const mfaEnabled = statusData?.data?.mfaEnabled ?? false;
  const backupRemaining = statusData?.data?.backupCodesRemaining ?? 0;

  const setupMutation = useMutation({
    mutationFn: mfaSetup,
    onSuccess: (res) => {
      setQrData({ qrCode: res.data.qrCode, secret: res.data.secret });
      setStep("scan");
    },
    onError: () => setError("Failed to initiate MFA setup."),
  });

  const confirmMutation = useMutation({
    mutationFn: mfaConfirm,
    onSuccess: (res) => {
      setBackupCodes(res.backupCodes);
      setStep("backup");
      void refetch();
      void refreshUser();
    },
    onError: () => setError("Invalid code. Please try again."),
  });

  const disableMutation = useMutation({
    mutationFn: mfaDisable,
    onSuccess: () => {
      toast.success("MFA disabled successfully.");
      void refetch();
      void refreshUser();
      setStep("status");
      setDisablePassword("");
    },
    onError: () => setError("Incorrect password or failed to disable MFA."),
  });

  const copySecret = () => {
    if (qrData?.secret) {
      void navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentalsphere-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display">Two-Factor Authentication</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Add an extra layer of security to your account using an authenticator app.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}>✕</button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ── STATUS ─────────────────────────────────────── */}
        {step === "status" && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className={`rounded-2xl border-2 p-6 ${mfaEnabled ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/40"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mfaEnabled ? "MFA is Enabled ✅" : "MFA is Disabled"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mfaEnabled
                      ? `${backupRemaining} backup codes remaining`
                      : "Your account is protected by password only."}
                  </p>
                </div>
                <div className={`h-3 w-3 rounded-full ${mfaEnabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              </div>
            </div>

            {mfaEnabled ? (
              <button
                onClick={() => { setError(null); setStep("disable"); }}
                className="w-full h-12 rounded-xl border-2 border-destructive/30 text-destructive font-semibold hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" /> Disable MFA
              </button>
            ) : (
              <button
                onClick={() => { setError(null); setupMutation.mutate(); }}
                disabled={setupMutation.isPending}
                className="w-full h-12 rounded-xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              >
                {setupMutation.isPending ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="h-4 w-4" /> Set Up MFA <ChevronRight className="h-4 w-4 ml-auto" />
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => void navigate({ to: "/dashboard" })}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Back to dashboard
            </button>
          </motion.div>
        )}

        {/* ── SCAN QR ─────────────────────────────────────── */}
        {step === "scan" && qrData && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="font-semibold">Step 1 — Scan this QR code</p>
              <p className="text-sm text-muted-foreground">
                Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app and scan the QR code below.
              </p>
              <div className="flex justify-center">
                <img src={qrData.qrCode} alt="MFA QR Code" className="h-52 w-52 rounded-xl border" />
              </div>
              <div className="rounded-xl bg-muted p-3 flex items-center justify-between gap-2">
                <code className="text-xs break-all">{qrData.secret}</code>
                <button onClick={copySecret} className="shrink-0 text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">Step 2 — Enter the 6-digit code</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-background transition-colors font-mono text-center tracking-widest text-lg outline-none"
              />
              <button
                onClick={() => { setError(null); confirmMutation.mutate(totp); }}
                disabled={totp.length !== 6 || confirmMutation.isPending}
                className="w-full h-12 rounded-xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
              >
                {confirmMutation.isPending ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify & Enable MFA <ShieldCheck className="h-4 w-4" /></>
                )}
              </button>
            </div>

            <button onClick={() => setStep("status")} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              ← Cancel
            </button>
          </motion.div>
        )}

        {/* ── BACKUP CODES ───────────────────────────────── */}
        {step === "backup" && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-5 w-5 text-emerald-500" />
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">MFA Enabled!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Save these backup codes somewhere safe. Each can only be used once.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Backup Codes</span>
                </div>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code
                    key={i}
                    className="bg-muted rounded-lg px-3 py-2 text-sm font-mono text-center tracking-wider"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("status")}
              className="w-full h-12 rounded-xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
            >
              Done — Go to Security Settings
            </button>
          </motion.div>
        )}

        {/* ── DISABLE MFA ─────────────────────────────────── */}
        {step === "disable" && (
          <motion.div
            key="disable"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5">
              <p className="font-semibold text-destructive">⚠️ Disabling MFA reduces your account security</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your current password to confirm.
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-destructive focus:bg-background transition-colors outline-none"
              />
            </div>
            <button
              onClick={() => { setError(null); disableMutation.mutate(disablePassword); }}
              disabled={!disablePassword || disableMutation.isPending}
              className="w-full h-12 rounded-xl bg-destructive text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-destructive/90 transition-colors"
            >
              {disableMutation.isPending ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Confirm Disable MFA"
              )}
            </button>
            <button onClick={() => setStep("status")} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              ← Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
