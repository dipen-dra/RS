/**
 * Centralized API client for RentalSphere.
 * All requests go through /api (proxied to localhost:5000 in dev).
 */

const BASE =
  import.meta.env.VITE_API_URL ||
  (typeof process !== "undefined" ? process.env.VITE_API_URL || process.env.API_URL : undefined) ||
  (typeof window === "undefined" ? "http://localhost:5001/api" : "/api");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Array<{ msg: string; path?: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string }).message || "Something went wrong",
      (data as { errors?: Array<{ msg: string; path?: string }> }).errors,
    );
  }

  return data as T;
}

// ── Types ──────────────────────────────────────────────────

export type UserRole = "user" | "admin" | "superadmin";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  license?: string;
  city?: string;
  avatar?: string;
  role: UserRole;
  createdAt?: string;
  isActive?: boolean;
  bookingsCount?: number;
  mfaEnabled?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  // MFA pending flow
  mfaPending?: boolean;
  userId?: string;
  message?: string;
}

export type VehicleType = "car" | "bike";
export interface Vehicle {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  type: VehicleType;
  category: string;
  pricePerDay: number;
  fuel: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission: "Automatic" | "Manual";
  seats: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  features: string[];
  location: string;
  description: string;
  isAvailable: boolean;
}

export type NotifType = "booking" | "payment" | "promo" | "alert" | "message";

export interface AppNotification {
  _id: string;
  type: NotifType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";
export interface Booking {
  _id: string;
  bookingId: string;
  vehicleName: string;
  vehicleImage: string;
  vehicleSlug: string;
  pickup: string;
  dropoff: string;
  startDate: string;
  endDate: string;
  days: number;
  subtotal: number;
  serviceFee: number;
  vat: number;
  discount: number;
  total: number;
  status: BookingStatus;
  payment: "Card" | "PayPal" | "Cash" | "Khalti" | "eSewa";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  license: string;
  couponCode?: string;
  insurance?: string;
  addons?: string[];
  createdAt: string;
  user?: { name: string; email: string };
}

export interface AdminStats {
  revenue: number;
  activeBookings: number;
  totalBookings: number;
  totalVehicles: number;
  totalUsers: number;
  dailyRevenue: Array<{ _id: number; revenue: number; count: number }>;
}

// ── Auth ───────────────────────────────────────────────────

export const loginUser = (email: string, password: string) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getCaptcha = () =>
  request<{ success: boolean; captchaSvg: string; captchaToken: string }>("/auth/captcha");

export const registerUser = (
  name: string,
  email: string,
  password: string,
  captchaAnswer: string,
  captchaToken: string,
) =>
  request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, captchaAnswer, captchaToken }),
  });

export const googleLogin = (credential: string) =>
  request<{ success: boolean; user: UserProfile; token: string }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

export const logoutUser = () => request<{ success: boolean }>("/auth/logout", { method: "POST" });

export const getMe = () => request<{ success: boolean; user: UserProfile }>("/auth/me");

// ── MFA ────────────────────────────────────────────────────

export const mfaSetup = () =>
  request<{ success: boolean; data: { secret: string; qrCode: string; otpAuthUrl: string } }>(
    "/mfa/setup",
    { method: "POST" },
  );

export const mfaConfirm = (token: string) =>
  request<{ success: boolean; message: string; backupCodes: string[] }>("/mfa/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const mfaValidate = (userId: string, token: string) =>
  request<AuthResponse & { usedBackupCode?: boolean; backupCodesRemaining?: number }>(
    "/mfa/validate",
    {
      method: "POST",
      body: JSON.stringify({ userId, token }),
    },
  );

export const mfaDisable = (password: string) =>
  request<{ success: boolean; message: string }>("/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const mfaStatus = () =>
  request<{ success: boolean; data: { mfaEnabled: boolean; backupCodesRemaining: number } }>(
    "/mfa/status",
  );

export const exportUserData = () =>
  fetch("/api/users/me/export", { credentials: "include" }).then((r) => r.blob());

export const updateUserRole = (id: string, role: UserRole) =>
  request<{ success: boolean; data: UserProfile; message: string }>(`/users/admin/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const forgotPassword = (email: string) =>
  request<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyOtp = (email: string, otp: string) =>
  request<{ success: boolean; message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

export const resetPassword = (email: string, otp: string, password: string) =>
  request<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });

// ── Vehicles ───────────────────────────────────────────────

export interface VehicleFilters {
  type?: string;
  category?: string;
  location?: string;
  maxPrice?: number;
  sort?: string;
  q?: string;
}

export const getVehicles = (filters: VehicleFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return request<{ success: boolean; data: Vehicle[] }>(`/vehicles${qs ? `?${qs}` : ""}`);
};

export const getVehicle = (slug: string) =>
  request<{ success: boolean; data: Vehicle }>(`/vehicles/${slug}`);

export const createVehicle = async (
  data: FormData,
): Promise<{ success: boolean; data: Vehicle }> => {
  const res = await fetch(`${BASE}/vehicles`, {
    method: "POST",
    credentials: "include",
    body: data,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.message || "Failed to create vehicle");
  return json;
};

export const updateVehicle = async (
  id: string,
  data: FormData,
): Promise<{ success: boolean; data: Vehicle }> => {
  const res = await fetch(`${BASE}/vehicles/${id}`, {
    method: "PUT",
    credentials: "include",
    body: data,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.message || "Failed to update vehicle");
  return json;
};

export const deleteVehicle = (id: string) =>
  request<{ success: boolean; message: string }>(`/vehicles/${id}`, { method: "DELETE" });

// ── Notifications ──────────────────────────────────────────

export const getNotifications = () =>
  request<{ success: boolean; data: AppNotification[] }>("/notifications");

export const markNotificationRead = (id: string) =>
  request<{ success: boolean; data: AppNotification }>(`/notifications/${id}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsRead = () =>
  request<{ success: boolean; message: string }>("/notifications/read-all", { method: "PATCH" });

// ── Bookings ───────────────────────────────────────────────

export interface CreateBookingPayload {
  vehicleSlug: string;
  startDate: string;
  endDate: string;
  pickup: string;
  dropoff?: string;
  payment: "Card" | "PayPal" | "Cash" | "Khalti" | "eSewa";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  license: string;
  couponCode?: string;
  insurance?: string;
  addons?: string[];
}

export const getMyBookings = (status?: string) => {
  const qs = status && status !== "all" ? `?status=${status}` : "";
  return request<{ success: boolean; data: Booking[] }>(`/bookings${qs}`);
};

export const createBooking = (payload: CreateBookingPayload) =>
  request<{ success: boolean; data: Booking }>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const cancelBooking = (id: string) =>
  request<{ success: boolean; data: Booking }>(`/bookings/${id}/cancel`, { method: "PATCH" });

export const getAllBookings = () =>
  request<{ success: boolean; data: Booking[] }>("/bookings/admin/all");

export const updateBookingStatus = (id: string, status: BookingStatus) =>
  request<{ success: boolean; data: Booking }>(`/bookings/admin/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteBooking = (id: string) =>
  request<{ success: boolean }>(`/bookings/admin/${id}`, { method: "DELETE" });

// ── Users ──────────────────────────────────────────────────

export const updateProfile = (data: Partial<UserProfile>) =>
  request<{ success: boolean; data: UserProfile }>("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const uploadAvatar = async (
  file: File,
): Promise<{ success: boolean; data: UserProfile }> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE}/users/profile/avatar`, {
    method: "PATCH",
    headers: {
      // Don't set Content-Type here, let the browser set it with the boundary for FormData
    },
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.message || "Avatar upload failed");
  }
  return data;
};

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ success: boolean; message: string }>("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const getAllUsers = () =>
  request<{ success: boolean; data: UserProfile[] }>("/users/admin/all");

export const updateUserStatus = (id: string, isActive: boolean) =>
  request<{ success: boolean; data: UserProfile }>(`/users/admin/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });


export const deleteUser = (id: string) =>
  request<{ success: boolean }>(`/users/admin/${id}`, { method: "DELETE" });

// ── Admin ──────────────────────────────────────────────────

export const getAdminStats = () => request<{ success: boolean; data: AdminStats }>("/admin/stats");

/* ── Payments ────────────────────────────────────────────── */

export async function initiateEsewaPayment(bookingData: CreateBookingPayload): Promise<{
  success: boolean;
  data: {
    ESEWA_URL: string;
    amount: string;
    success_url: string;
    failure_url: string;
    product_delivery_charge: string;
    product_service_charge: string;
    product_code: string;
    signature: string;
    signed_field_names: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
  };
}> {
  return request("/payment/esewa/initiate", {
    method: "POST",
    body: JSON.stringify({ bookingData }),
  });
}

export async function verifyEsewaPayment(
  data: string,
): Promise<{ success: boolean; data: Booking }> {
  return request(`/payment/esewa/verify?data=${encodeURIComponent(data)}`, { method: "GET" });
}

export async function verifyKhaltiPayment(
  token: string,
  amount: number,
  bookingData: CreateBookingPayload,
): Promise<{ success: boolean; data: Booking }> {
  return request("/payment/khalti/verify", {
    method: "POST",
    body: JSON.stringify({ token, amount, bookingData }),
  });
}

/* ── Contact Queries ───────────────────────────────────────── */

export interface ContactQuery {
  _id: string;
  user?: UserProfile;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply?: string;
  isReplied: boolean;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const submitQuery = (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) =>
  request<{ success: boolean; data: ContactQuery }>("/queries", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getAdminQueries = () =>
  request<{ success: boolean; data: ContactQuery[] }>("/queries/admin/all");

export const getUserQueries = () =>
  request<{ success: boolean; data: ContactQuery[] }>("/queries/me");

export const replyToQuery = (id: string, reply: string) =>
  request<{ success: boolean; data: ContactQuery }>(`/queries/admin/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ reply }),
  });

