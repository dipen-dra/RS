import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, X, Edit2, Save, Camera, Lock } from "lucide-react";
import { updateProfile, changePassword, uploadAvatar } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileTab,
});

function ProfileTab() {
  const { user, setUser } = useAuth();

  if (!user) return null;

  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    license: user.license ?? "",
    city: user.city ?? "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (res) => {
      setUser({ ...user, ...res.data });
      setEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const { mutate: savePw, isPending: savingPw } = useMutation({
    mutationFn: () => changePassword(pwForm.currentPassword, pwForm.newPassword),
    onSuccess: () => {
      setChangingPw(false);
      setPwForm({ currentPassword: "", newPassword: "" });
      toast.success("Password changed successfully.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: saveAvatar, isPending: savingAvatar } = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (res) => {
      setUser({ ...user, ...res.data });
      toast.success("Profile picture updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      saveAvatar(e.target.files[0]);
    }
  };

  const fields = [
    { label: "Full name", key: "name" as const },
    { label: "Email", key: "email" as const },
    { label: "Phone", key: "phone" as const },
    { label: "License #", key: "license" as const },
    { label: "City", key: "city" as const },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink mb-6">Profile</h2>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div
            className={cn(
              "relative group h-20 w-20 rounded-full font-bold text-2xl inline-flex items-center justify-center overflow-hidden shrink-0",
              user.avatar ? "bg-background" : "gradient-brand text-white",
            )}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            )}
            <label
              className={cn(
                "absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity",
                savingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={savingAvatar}
              />
              {savingAvatar ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </label>
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-ink">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize">
              {user.role} · Member since{" "}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
          <button
            onClick={() => setEditing((s) => !s)}
            className="ml-auto h-10 px-5 rounded-full text-sm font-medium gradient-brand text-white flex items-center gap-2"
          >
            {editing ? (
              <>
                <X className="h-3.5 w-3.5" /> Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </>
            )}
          </button>
        </div>

        {editing ? (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 pt-6">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </span>
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="mt-1 w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
                />
              </label>
            ))}
            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={() => saveProfile()}
                disabled={saving}
                className="h-10 px-6 rounded-full gradient-brand text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 pt-6">
            {fields.map((f) => (
              <div key={f.label}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </div>
                <div className="mt-1 text-sm font-medium text-ink">{form[f.key] || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </h3>
          <button
            onClick={() => setChangingPw((s) => !s)}
            className="text-sm text-primary font-medium"
          >
            {changingPw ? "Cancel" : "Change password"}
          </button>
        </div>
        {changingPw && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Current password
              </span>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((d) => ({ ...d, currentPassword: e.target.value }))}
                className="mt-1 w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                New password
              </span>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((d) => ({ ...d, newPassword: e.target.value }))}
                className="mt-1 w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:outline-none text-sm"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={() => savePw()}
                disabled={savingPw}
                className="h-10 px-6 rounded-full gradient-brand text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                {savingPw ? "Saving…" : "Update password"}
              </button>
            </div>
          </div>
        )}
        {!changingPw && (
          <div className="mt-4 space-y-3 text-sm">
            <PrefRow label="Email notifications" enabled />
            <PrefRow label="SMS updates" enabled />
            <PrefRow label="Marketing emails" />
          </div>
        )}
      </div>
    </div>
  );
}

function PrefRow({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-foreground/80">{label}</span>
      {enabled ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground/50" />
      )}
    </div>
  );
}
