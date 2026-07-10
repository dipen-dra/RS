interface PendingBooking {
  userId: string;
  vehicleSlug: string;
  startDate: string;
  endDate: string;
  pickup: string;
  dropoff?: string;
  payment: "Khalti" | "eSewa" | "Cash";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  license: string;
  couponCode?: string;
  insurance?: string;
  addons?: string[];
  // Metadata for verification
  totalAmount: number;
}

const pendingBookings = new Map<string, PendingBooking>();

export const generateBookingId = () => {
  return `DN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};

export const storePendingBooking = (id: string, data: PendingBooking) => {
  pendingBookings.set(id, data);
  // Auto-expire after 30 minutes
  setTimeout(
    () => {
      pendingBookings.delete(id);
    },
    30 * 60 * 1000,
  );
};

export const getPendingBooking = (id: string): PendingBooking | undefined => {
  return pendingBookings.get(id);
};

export const deletePendingBooking = (id: string) => {
  pendingBookings.delete(id);
};
