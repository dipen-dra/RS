import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, CheckCircle, XCircle, Shield, Crown, User as UserIcon } from "lucide-react";
import { getAllUsers, updateUserStatus, deleteUser, updateUserRole, type UserProfile, type UserRole } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/overview" });
  },
  component: UsersTab,
});

const roleConfig: Record<UserRole, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  user: { label: "User", bg: "bg-muted", color: "text-muted-foreground", icon: UserIcon },
  admin: { label: "Admin", bg: "bg-primary/10", color: "text-primary", icon: Shield },
  superadmin: { label: "Super Admin", bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400", icon: Crown },
};

function UsersTab() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const { data, isLoading } = useQuery({ queryKey: ["adminUsers"], queryFn: getAllUsers });
  const users = data?.data ?? [];

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User status updated successfully");
    },
    onError: () => toast.error("Failed to update user status"),
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(res.message);
    },
    onError: () => toast.error("Failed to update role"),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User deleted successfully");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Bookings</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">MFA</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u: UserProfile) => {
              const role = u.role as UserRole;
              const rc = roleConfig[role] ?? roleConfig.user;
              const RoleIcon = rc.icon;
              const isSelf = u._id === currentUser?._id;
              return (
                <tr
                  key={u._id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "h-9 w-9 rounded-full inline-flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0",
                          u.avatar ? "bg-background" : "gradient-brand text-white",
                        )}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          u.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        )}
                      </span>
                      <div className="font-medium text-ink">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">{u.bookingsCount ?? 0}</td>
                  <td className="px-5 py-3">
                    {isSuperAdmin && !isSelf ? (
                      /* Role selector — superadmin only */
                      <select
                        value={role}
                        onChange={(e) =>
                          changeRole({ id: u._id, role: e.target.value as UserRole })
                        }
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer",
                          rc.bg,
                          rc.color,
                        )}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                          rc.bg,
                          rc.color,
                        )}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {rc.label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.mfaEnabled ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                        u.isActive !== false
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {u.isActive !== false ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ConfirmModal
                        title={u.isActive !== false ? "Suspend User" : "Activate User"}
                        description={`Are you sure you want to ${u.isActive !== false ? "suspend" : "activate"} this user?`}
                        onConfirm={() => toggleStatus({ id: u._id, isActive: u.isActive === false })}
                        confirmText={u.isActive !== false ? "Suspend" : "Activate"}
                        variant={u.isActive !== false ? "destructive" : "default"}
                      >
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted"
                          title={u.isActive !== false ? "Suspend" : "Activate"}
                        >
                          {u.isActive !== false ? (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </button>
                      </ConfirmModal>
                      <ConfirmModal
                        title="Delete User"
                        description="Are you sure you want to permanently delete this user?"
                        onConfirm={() => doDelete(u._id)}
                        confirmText="Delete"
                      >
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </ConfirmModal>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
