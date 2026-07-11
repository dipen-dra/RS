/**
 * Full historical seed script — RentalSphere
 * Creates: 3 role accounts + 8 regular users, 9 vehicles,
 *          ~80 bookings over last 6 months, queries, notifications, audit logs
 * Run: npx tsx src/seed_all.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { Vehicle } from "./models/Vehicle.js";
import { User } from "./models/User.js";
import { Booking } from "./models/Booking.js";
import { Query } from "./models/Query.js";
import { Notification } from "./models/Notification.js";
import { AuditLog } from "./models/AuditLog.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
const img = (q: string, w = 1200) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=${w}&q=80`;

/** Return a random Date within the past `months` months */
function randomPast(months = 6): Date {
  const now = Date.now();
  const msBack = months * 30 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * msBack);
}

/** Random int between min and max inclusive */
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bookingId(): string {
  return `DN-${rand(100000, 999999)}`;
}

// ── Vehicle data ──────────────────────────────────────────────────────────────
const vehicleData = [
  { slug: "tesla-model-3", name: "Tesla Model 3", brand: "Tesla", type: "car", category: "Electric", pricePerDay: 125, fuel: "Electric", transmission: "Automatic", seats: 5, rating: 4.9, reviews: 184, image: img("photo-1560958089-b8a1929cea89"), gallery: [img("photo-1560958089-b8a1929cea89"), img("photo-1554744512-d6c603f27c54")], features: ["Autopilot", "Panoramic Roof", "Premium Audio", "Fast Charging"], location: "London", description: "Silent, swift, and Tesla-clean." },
  { slug: "toyota-fortuner", name: "Toyota Fortuner", brand: "Toyota", type: "car", category: "SUV", pricePerDay: 98, fuel: "Diesel", transmission: "Automatic", seats: 7, rating: 4.7, reviews: 221, image: img("photo-1606664515524-ed2f786a0bd6"), gallery: [img("photo-1606664515524-ed2f786a0bd6")], features: ["4WD", "Cruise Control", "Roof Rack"], location: "Edinburgh", description: "A commanding SUV for the UK countryside." },
  { slug: "bmw-3-series", name: "BMW 3 Series", brand: "BMW", type: "car", category: "Luxury", pricePerDay: 145, fuel: "Petrol", transmission: "Automatic", seats: 5, rating: 4.8, reviews: 96, image: img("photo-1555215695-3004980ad54e"), gallery: [img("photo-1555215695-3004980ad54e")], features: ["Leather Interior", "Navigation", "Sport Mode"], location: "London", description: "The ultimate driving machine." },
  { slug: "hyundai-i20", name: "Hyundai i20", brand: "Hyundai", type: "car", category: "Economy", pricePerDay: 42, fuel: "Petrol", transmission: "Manual", seats: 5, rating: 4.5, reviews: 312, image: img("photo-1549924231-f129b911e442"), gallery: [img("photo-1549924231-f129b911e442")], features: ["Bluetooth", "USB Charging", "AC"], location: "London", description: "Compact, efficient, easy to park." },
  { slug: "porsche-911", name: "Porsche 911", brand: "Porsche", type: "car", category: "Sports", pricePerDay: 280, fuel: "Petrol", transmission: "Automatic", seats: 4, rating: 5.0, reviews: 42, image: img("photo-1503376780353-7e6692767b70"), gallery: [img("photo-1503376780353-7e6692767b70")], features: ["Launch Control", "Sport Chrono", "Carbon Trim"], location: "London", description: "An icon. Pure sports DNA." },
  { slug: "royal-enfield-himalayan", name: "Royal Enfield Himalayan", brand: "Royal Enfield", type: "bike", category: "Adventure", pricePerDay: 28, fuel: "Petrol", transmission: "Manual", seats: 2, rating: 4.8, reviews: 410, image: img("photo-1568772585407-9361f9bf3a87"), gallery: [img("photo-1568772585407-9361f9bf3a87")], features: ["Off-road Tyres", "Crash Guard", "Long Range Tank"], location: "Edinburgh", description: "Built for adventure." },
  { slug: "yamaha-r15", name: "Yamaha R15 V4", brand: "Yamaha", type: "bike", category: "Sports", pricePerDay: 22, fuel: "Petrol", transmission: "Manual", seats: 2, rating: 4.7, reviews: 256, image: img("photo-1558981806-ec527fa84c39"), gallery: [img("photo-1558981806-ec527fa84c39")], features: ["Quick Shifter", "Dual Channel ABS", "Track Mode"], location: "London", description: "Razor-sharp sports DNA." },
  { slug: "honda-dio", name: "Honda Dio", brand: "Honda", type: "bike", category: "Scooter", pricePerDay: 9, fuel: "Petrol", transmission: "Automatic", seats: 2, rating: 4.6, reviews: 530, image: img("photo-1611241893603-3c359704e0ee"), gallery: [img("photo-1611241893603-3c359704e0ee")], features: ["Mobile Charger", "Under-seat Storage", "LED DRL"], location: "London", description: "Zip across the city." },
  { slug: "harley-iron-883", name: "Harley-Davidson Iron 883", brand: "Harley-Davidson", type: "bike", category: "Cruiser", pricePerDay: 58, fuel: "Petrol", transmission: "Manual", seats: 2, rating: 4.9, reviews: 88, image: img("photo-1558981403-c5f9899a28bc"), gallery: [img("photo-1558981403-c5f9899a28bc")], features: ["V-Twin Engine", "Classic Cruiser", "Saddle Bags"], location: "London", description: "An American legend." },
];

// ── Core account definitions ──────────────────────────────────────────────────
const coreAccounts = [
  { name: "Super Admin", email: "superadmin@rentalsphere.com", password: "SuperAdmin@2024!", role: "superadmin" as const, phone: "+44 7700 000001", city: "London", license: "SA-001-SUPER" },
  { name: "RS Admin",    email: "admin@rentalsphere.com",      password: "Admin@2024!",      role: "admin" as const,      phone: "+44 7700 000002", city: "London", license: "AD-002-ADMIN" },
  { name: "John Smith",  email: "user@rentalsphere.com",       password: "User@2024!",        role: "user" as const,       phone: "+44 7700 000003", city: "Manchester", license: "UK-JS-112233" },
];

// ── Extra regular users ───────────────────────────────────────────────────────
const extraUsers = [
  { name: "Emily Clark",   email: "emily.clark@example.com",   password: "Emily@2024!",   phone: "+44 7700 100001", city: "Birmingham", license: "UK-EC-223344" },
  { name: "James Wilson",  email: "james.wilson@example.com",  password: "James@2024!",   phone: "+44 7700 100002", city: "Leeds",       license: "UK-JW-334455" },
  { name: "Priya Sharma",  email: "priya.sharma@example.com",  password: "Priya@2024!",   phone: "+44 7700 100003", city: "London",      license: "UK-PS-445566" },
  { name: "Oliver Brown",  email: "oliver.brown@example.com",  password: "Oliver@2024!",  phone: "+44 7700 100004", city: "Edinburgh",   license: "UK-OB-556677" },
  { name: "Aisha Patel",   email: "aisha.patel@example.com",   password: "Aisha@2024!",   phone: "+44 7700 100005", city: "Bristol",     license: "UK-AP-667788" },
];

// ── Support queries data ──────────────────────────────────────────────────────
const queryTemplates = [
  { subject: "Booking cancellation refund", message: "I cancelled my booking 3 days ago but haven't received my refund yet. Booking ref DN-182736. Please advise.", reply: "Hi, your refund has been processed and should appear within 3-5 business days. Sorry for the delay!", isReplied: true },
  { subject: "Vehicle condition on pickup", message: "The Toyota Fortuner I picked up had a scratch on the rear bumper that wasn't in the photos. Who should I contact?", reply: "Thank you for flagging this. We've noted the pre-existing damage on your account. Please take photos and email fleet@rentalsphere.com.", isReplied: true },
  { subject: "Can I extend my rental period?", message: "I'm currently renting the BMW 3 Series and would like to extend by 2 more days. Is that possible?", reply: "Absolutely! Please call our hotline or use the dashboard to extend. We'll check availability and update your booking.", isReplied: true },
  { subject: "MFA setup not working", message: "I'm trying to set up two-factor authentication but the QR code won't scan with Google Authenticator.", reply: "Try brightening your screen or using the manual entry code shown below the QR code. Let us know if the issue persists.", isReplied: true },
  { subject: "eSewa payment failed but money deducted", message: "I tried to pay via eSewa and the money was deducted from my wallet but booking shows as pending.", reply: null, isReplied: false },
  { subject: "Invoice for business trip", message: "I need a VAT invoice for my Tesla Model 3 rental from 15 Jan to 18 Jan for expense claims.", reply: "Your VAT invoice has been emailed to your registered address. Please check spam if not received.", isReplied: true },
  { subject: "Driving in Scotland — any restrictions?", message: "I've booked the Harley Iron 883 from Edinburgh. Are there any motorway restrictions I should know about?", reply: "No motorway restrictions for the Iron 883. Enjoy the ride! Please carry your rental agreement at all times.", isReplied: true },
  { subject: "Wrong pickup location shown", message: "The app shows my pickup as Lalitpur but I selected Kathmandu. Can this be changed before pickup?", reply: null, isReplied: false },
  { subject: "Loyalty discount not applied", message: "I've rented 5 times this year but my DRIVE10 coupon code says expired. Is there a new code?", reply: "DRIVE10 was valid through March. Our new seasonal code SUMMER15 gives 15% off — apply it at checkout!", isReplied: true },
  { subject: "Child seat availability", message: "Do you provide child seats for the Toyota Fortuner? I'm travelling with a 4-year-old.", reply: "Yes! Select the 'Child Seat' add-on during booking (Rs. 300/day). It'll be fitted and ready on pickup.", isReplied: true },
  { subject: "App login issue after password change", message: "After resetting my password I can't log in. The app keeps saying invalid credentials.", reply: null, isReplied: false },
  { subject: "Bike helmet included?", message: "Is a helmet provided with the Royal Enfield Himalayan rental or do I need my own?", reply: "Helmets are available as an add-on (Rs. 150/day). We strongly recommend selecting this for safety compliance.", isReplied: true },
];

// ── Audit log event templates ──────────────────────────────────────────────────
const auditEvents = [
  { eventType: "AUTH_SUCCESS",         severity: "info"     as const },
  { eventType: "AUTH_FAILED",          severity: "warning"  as const },
  { eventType: "PASSWORD_CHANGED",     severity: "info"     as const },
  { eventType: "SESSION_INVALIDATED",  severity: "info"     as const },
  { eventType: "MFA_ENABLED",          severity: "info"     as const },
  { eventType: "DATA_EXPORT",          severity: "info"     as const },
  { eventType: "ADMIN_ACTION",         severity: "warning"  as const },
  { eventType: "AUTH_FAILED",          severity: "warning"  as const },
  { eventType: "ACCOUNT_LOCKED",       severity: "warning"  as const },
  { eventType: "UNAUTHORIZED_ACCESS",  severity: "critical" as const },
  { eventType: "IDOR_ATTEMPT",         severity: "critical" as const },
  { eventType: "PAYMENT_TAMPERING",    severity: "critical" as const },
];

const ips = ["192.168.1.14", "10.0.0.55", "172.16.0.3", "89.12.34.56", "45.67.89.10", "203.0.113.42"];
const agents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148 Safari",
  "Mozilla/5.0 (Linux; Android 13) Chrome/118 Mobile",
];

const locations = ["London", "Edinburgh", "Manchester", "Birmingham", "Bristol"];
const paymentMethods = ["Card", "PayPal", "Cash", "Khalti", "eSewa"] as const;
const insuranceTypes = ["basic", "plus", "max"] as const;
const statuses = ["completed", "completed", "completed", "cancelled", "upcoming", "active"] as const;

// ── Main seed ─────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log("\n🌱 RentalSphere Full Historical Seed\n" + "=".repeat(45));

  // 1. Vehicles
  console.log("\n📦 Seeding vehicles...");
  const vehicleDocs: Record<string, mongoose.Types.ObjectId & { pricePerDay: number; name: string; image: string; slug: string }> = {};
  for (const v of vehicleData) {
    const doc = await Vehicle.findOneAndUpdate({ slug: v.slug }, v, { upsert: true, new: true });
    vehicleDocs[v.slug] = doc!._id as unknown as mongoose.Types.ObjectId & { pricePerDay: number; name: string; image: string; slug: string };
    console.log(`  ✅ ${v.name}`);
  }
  const vehicles = await Vehicle.find();

  // 2. Core accounts (superadmin, admin, user)
  console.log("\n👤 Seeding core accounts...");
  const userMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const acc of coreAccounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      userMap[acc.email] = existing._id as mongoose.Types.ObjectId;
      console.log(`  ℹ️  ${acc.role} already exists — skipping`);
      continue;
    }
    const u = await User.create({
      name: acc.name,
      email: acc.email,
      password: acc.password,  // pre-save hook will hash this
      role: acc.role,
      phone: acc.phone,
      city: acc.city,
      license: acc.license,
      isActive: true,
      lastLogin: randomPast(1),
    });
    userMap[acc.email] = u._id as mongoose.Types.ObjectId;
    console.log(`  ✅ ${acc.role}: ${acc.email}  /  ${acc.password}`);
  }

  // 3. Extra regular users
  console.log("\n👥 Seeding extra users...");
  const extraUserIds: mongoose.Types.ObjectId[] = [];
  for (const eu of extraUsers) {
    let u = await User.findOne({ email: eu.email });
    if (!u) {
      u = await User.create({
        name: eu.name,
        email: eu.email,
        password: eu.password,  // pre-save hook will hash this
        role: "user",
        phone: eu.phone,
        city: eu.city,
        license: eu.license,
        isActive: true,
        lastLogin: randomPast(2),
      });
      console.log(`  ✅ ${eu.name} — ${eu.email}`);
    } else {
      console.log(`  ℹ️  ${eu.name} already exists`);
    }
    extraUserIds.push(u._id as mongoose.Types.ObjectId);
  }

  // Collect all regular user IDs for bookings
  const allUserIds = [
    userMap["user@rentalsphere.com"],
    ...extraUserIds,
  ].filter(Boolean);

  // 4. Bookings — 6 months of history
  console.log("\n📅 Seeding bookings (6 months history)...");
  const existingBookings = await Booking.countDocuments();
  if (existingBookings > 10) {
    console.log(`  ℹ️  ${existingBookings} bookings already exist — skipping`);
  } else {
    let bookingCount = 0;
    for (let i = 0; i < 85; i++) {
      const vehicle = vehicles[i % vehicles.length];
      const userId = allUserIds[i % allUserIds.length];
      const startDate = randomPast(6);
      const days = rand(1, 7);
      const endDate = new Date(startDate.getTime() + days * 86400000);
      const now = new Date();

      const subtotal = vehicle.pricePerDay * days;
      const serviceFee = Math.round(subtotal * 0.05);
      const vat = Math.round(subtotal * 0.2);
      const discount = i % 7 === 0 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + serviceFee + vat - discount;

      // Determine realistic status based on dates
      let status: typeof statuses[number];
      if (endDate < now) {
        status = i % 5 === 0 ? "cancelled" : "completed";
      } else if (startDate <= now && endDate >= now) {
        status = "active";
      } else {
        status = "upcoming";
      }

      const userDoc = await User.findById(userId);

      await Booking.create({
        bookingId: bookingId(),
        user: userId,
        vehicle: vehicle._id,
        vehicleName: vehicle.name,
        vehicleImage: vehicle.image,
        vehicleSlug: vehicle.slug,
        pickup: pick(locations),
        dropoff: pick(locations),
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        days,
        subtotal,
        serviceFee,
        vat,
        discount,
        total,
        status,
        payment: pick([...paymentMethods]),
        insurance: pick([...insuranceTypes]),
        addons: i % 3 === 0 ? ["gps"] : i % 4 === 0 ? ["driver", "gps"] : [],
        customerName: userDoc?.name ?? "Customer",
        customerEmail: userDoc?.email ?? "customer@example.com",
        customerPhone: userDoc?.phone ?? "+44 7700 000000",
        license: userDoc?.license ?? "UK-000000",
        couponCode: i % 7 === 0 ? "DRIVE10" : undefined,
        calculatedTotal: total,
        serverValidated: true,
        createdAt: startDate,
        updatedAt: startDate,
      });
      bookingCount++;
    }
    console.log(`  ✅ ${bookingCount} bookings created`);
  }

  // 5. Queries
  console.log("\n📨 Seeding support queries...");
  const existingQueries = await Query.countDocuments();
  if (existingQueries > 5) {
    console.log(`  ℹ️  Queries already exist — skipping`);
  } else {
    for (let i = 0; i < queryTemplates.length; i++) {
      const qt = queryTemplates[i];
      const userId = allUserIds[i % allUserIds.length];
      const userDoc = await User.findById(userId);
      const createdAt = randomPast(5);
      await Query.create({
        user: userId,
        name: userDoc?.name ?? "Customer",
        email: userDoc?.email ?? "customer@example.com",
        subject: qt.subject,
        message: qt.message,
        reply: qt.reply ?? undefined,
        isReplied: qt.isReplied,
        repliedAt: qt.isReplied ? new Date(createdAt.getTime() + rand(1, 24) * 3600000) : undefined,
        createdAt,
        updatedAt: createdAt,
      });
    }
    console.log(`  ✅ ${queryTemplates.length} queries created`);
  }

  // 6. Notifications
  console.log("\n🔔 Seeding notifications...");
  const existingNotifs = await Notification.countDocuments();
  if (existingNotifs > 10) {
    console.log(`  ℹ️  Notifications already exist — skipping`);
  } else {
    const notifTemplates = [
      { type: "booking", title: "Booking Confirmed!", body: "Your booking has been confirmed and payment received.", href: "/dashboard" },
      { type: "booking", title: "Booking Cancelled", body: "Your booking has been cancelled as requested.", href: "/dashboard" },
      { type: "alert",   title: "Welcome to RentalSphere!", body: "Explore our fleet and book your first vehicle today.", href: "/" },
      { type: "payment", title: "Payment Successful", body: "Your payment was processed successfully.", href: "/dashboard" },
      { type: "alert",   title: "Security Alert", body: "A new login was detected from a new device.", href: "/dashboard/profile" },
      { type: "booking", title: "Rental Starting Tomorrow", body: "Don't forget — your rental starts tomorrow. Have a great trip!", href: "/dashboard" },
    ];

    let notifCount = 0;
    for (const userId of allUserIds) {
      for (let j = 0; j < 3; j++) {
        const t = notifTemplates[j % notifTemplates.length];
        await Notification.create({
          user: userId,
          type: t.type,
          title: t.title,
          body: t.body,
          href: t.href,
          read: Math.random() > 0.4,
          createdAt: randomPast(4),
        });
        notifCount++;
      }
    }
    console.log(`  ✅ ${notifCount} notifications created`);
  }

  // 7. Audit Logs
  console.log("\n🛡️  Seeding audit logs...");
  const existingLogs = await AuditLog.countDocuments();
  if (existingLogs > 20) {
    console.log(`  ℹ️  Audit logs already exist — skipping`);
  } else {
    const allUsers = await User.find();
    let logCount = 0;
    for (let i = 0; i < 120; i++) {
      const evt = auditEvents[i % auditEvents.length];
      const user = allUsers[i % allUsers.length];
      await AuditLog.create({
        eventType: evt.eventType,
        severity: evt.severity,
        userId: user._id,
        ipAddress: pick(ips),
        userAgent: pick(agents),
        timestamp: randomPast(6),
        details: {
          action: evt.eventType.toLowerCase(),
          userEmail: user.email,
          ...(evt.eventType === "AUTH_FAILED" ? { reason: "Invalid password", attempts: rand(1, 5) } : {}),
          ...(evt.eventType === "PAYMENT_TAMPERING" ? { paidAmount: rand(40, 200), expectedAmount: rand(200, 400) } : {}),
          ...(evt.eventType === "ADMIN_ACTION" ? { target: "booking", action: "status_update" } : {}),
        },
      });
      logCount++;
    }
    console.log(`  ✅ ${logCount} audit log entries created`);
  }

  // ── Final summary ────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(45));
  console.log("🎉 SEED COMPLETE!\n");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│           LOGIN CREDENTIALS                 │");
  console.log("├──────────────┬──────────────────────────────┤");
  console.log("│ SUPERADMIN   │ superadmin@rentalsphere.com  │");
  console.log("│              │ SuperAdmin@2024!             │");
  console.log("├──────────────┼──────────────────────────────┤");
  console.log("│ ADMIN        │ admin@rentalsphere.com       │");
  console.log("│              │ Admin@2024!                  │");
  console.log("├──────────────┼──────────────────────────────┤");
  console.log("│ USER         │ user@rentalsphere.com        │");
  console.log("│              │ User@2024!                   │");
  console.log("└──────────────┴──────────────────────────────┘\n");

  await mongoose.connection.removeAllListeners();
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
