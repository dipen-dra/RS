/**
 * Seed historical data spanning the last 3 months.
 * Populates:
 *  - Core vehicles (upserted)
 *  - 10 mock users
 *  - 60 bookings spread across the last 90 days (active, completed, cancelled, upcoming) with accurate pricing
 *  - 12 contact queries (some replied, some pending)
 * Run via: npx tsx src/seed_history.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Vehicle } from "./models/Vehicle.js";
import { User } from "./models/User.js";
import { Booking } from "./models/Booking.js";
import { Query } from "./models/Query.js";

const img = (q: string, w = 1200) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=${w}&q=80`;

const vehicleData = [
  {
    slug: "tesla-model-3",
    name: "Tesla Model 3",
    brand: "Tesla",
    type: "car",
    category: "Electric",
    pricePerDay: 125,
    fuel: "Electric",
    transmission: "Automatic",
    seats: 5,
    rating: 4.9,
    reviews: 184,
    image: img("photo-1560958089-b8a1929cea89"),
    gallery: [
      img("photo-1560958089-b8a1929cea89"),
      img("photo-1554744512-d6c603f27c54"),
      img("photo-1617788138017-80ad40651399"),
    ],
    features: ["Autopilot", "Panoramic Roof", "Premium Audio", "Fast Charging"],
    location: "London",
    description: "Silent, swift, and Tesla-clean. Perfect for premium city drives across the UK.",
  },
  {
    slug: "toyota-fortuner",
    name: "Toyota Fortuner",
    brand: "Toyota",
    type: "car",
    category: "SUV",
    pricePerDay: 98,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 7,
    rating: 4.7,
    reviews: 221,
    image: img("photo-1606664515524-ed2f786a0bd6"),
    gallery: [img("photo-1606664515524-ed2f786a0bd6"), img("photo-1583121274602-3e2820c69888")],
    features: ["4WD", "Cruise Control", "Roof Rack", "Hill Descent"],
    location: "Edinburgh",
    description: "A commanding SUV built for the UK's countryside and family expeditions.",
  },
  {
    slug: "bmw-3-series",
    name: "BMW 3 Series",
    brand: "BMW",
    type: "car",
    category: "Luxury",
    pricePerDay: 145,
    fuel: "Petrol",
    transmission: "Automatic",
    seats: 5,
    rating: 4.8,
    reviews: 96,
    image: img("photo-1555215695-3004980ad54e"),
    gallery: [img("photo-1555215695-3004980ad54e"), img("photo-1503376780353-7e6692767b70")],
    features: ["Leather Interior", "Navigation", "Sport Mode", "Heated Seats"],
    location: "London",
    description: "The ultimate driving machine — refined, fast, and unmistakably German.",
  },
  {
    slug: "hyundai-i20",
    name: "Hyundai i20",
    brand: "Hyundai",
    type: "car",
    category: "Economy",
    pricePerDay: 42,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 5,
    rating: 4.5,
    reviews: 312,
    image: img("photo-1549924231-f129b911e442"),
    gallery: [img("photo-1549924231-f129b911e442")],
    features: ["Bluetooth", "USB Charging", "AC", "Fuel Efficient"],
    location: "London",
    description: "Compact, efficient, and easy to park — your dependable everyday ride.",
  },
  {
    slug: "porsche-911",
    name: "Porsche 911",
    brand: "Porsche",
    type: "car",
    category: "Sports",
    pricePerDay: 280,
    fuel: "Petrol",
    transmission: "Automatic",
    seats: 4,
    rating: 5.0,
    reviews: 42,
    image: img("photo-1503376780353-7e6692767b70"),
    gallery: [img("photo-1503376780353-7e6692767b70"), img("photo-1555215695-3004980ad54e")],
    features: ["Launch Control", "Sport Chrono", "Carbon Trim", "Premium Sound"],
    location: "London",
    description: "An icon. Pure sports DNA wrapped in timeless silhouette.",
  },
  {
    slug: "royal-enfield-himalayan",
    name: "Royal Enfield Himalayan",
    brand: "Royal Enfield",
    type: "bike",
    category: "Adventure",
    pricePerDay: 28,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 2,
    rating: 4.8,
    reviews: 410,
    image: img("photo-1568772585407-9361f9bf3a87"),
    gallery: [img("photo-1568772585407-9361f9bf3a87"), img("photo-1558981806-ec527fa84c39")],
    features: ["Off-road Tyres", "Crash Guard", "Pannier Mounts", "Long Range Tank"],
    location: "Edinburgh",
    description: "Built for adventure. Conquer the Scottish Highlands and beyond.",
  },
  {
    slug: "yamaha-r15",
    name: "Yamaha R15 V4",
    brand: "Yamaha",
    type: "bike",
    category: "Sports",
    pricePerDay: 22,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 2,
    rating: 4.7,
    reviews: 256,
    image: img("photo-1558981806-ec527fa84c39"),
    gallery: [img("photo-1558981806-ec527fa84c39")],
    features: ["Quick Shifter", "Dual Channel ABS", "Track Mode", "LED Headlamp"],
    location: "London",
    description: "Razor-sharp sports DNA in a featherweight chassis.",
  },
  {
    slug: "honda-dio",
    name: "Honda Dio",
    brand: "Honda",
    type: "bike",
    category: "Scooter",
    pricePerDay: 9,
    fuel: "Petrol",
    transmission: "Automatic",
    seats: 2,
    rating: 4.6,
    reviews: 530,
    image: img("photo-1611241893603-3c359704e0ee"),
    gallery: [img("photo-1611241893603-3c359704e0ee")],
    features: ["Mobile Charger", "Under-seat Storage", "LED DRL", "Eco Mode"],
    location: "London",
    description: "Zip across the city. Stylish, light, and fuel-friendly.",
  },
  {
    slug: "harley-iron-883",
    name: "Harley-Davidson Iron 883",
    brand: "Harley-Davidson",
    type: "bike",
    category: "Cruiser",
    pricePerDay: 58,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 2,
    rating: 4.9,
    reviews: 88,
    image: img("photo-1558981403-c5f9899a28bc"),
    gallery: [img("photo-1558981403-c5f9899a28bc")],
    features: ["V-Twin Engine", "Classic Cruiser", "Saddle Bags", "Custom Pipes"],
    location: "London",
    description: "The sound, the silhouette, the soul. An American legend.",
  },
];

const mockUserData = [
  {
    name: "John Doe",
    email: "john@rentalsphere.com",
    phone: "07700900077",
    city: "London",
    license: "UK-01020304",
  },
  {
    name: "Alice Smith",
    email: "alice@rentalsphere.com",
    phone: "07700900088",
    city: "Edinburgh",
    license: "UK-98765432",
  },
  {
    name: "Rory Smith",
    email: "rory@rentalsphere.com",
    phone: "07700900011",
    city: "Manchester",
    license: "UK-24681012",
  },
  {
    name: "Stella Thomas",
    email: "stella@rentalsphere.com",
    phone: "07700900022",
    city: "Birmingham",
    license: "UK-13579111",
  },
  {
    name: "David Miller",
    email: "david@rentalsphere.com",
    phone: "07700900033",
    city: "London",
    license: "UK-99887766",
  },
  {
    name: "Patricia Green",
    email: "patricia@rentalsphere.com",
    phone: "07700900044",
    city: "Edinburgh",
    license: "UK-33445566",
  },
  {
    name: "Benjamin Adams",
    email: "benjamin@rentalsphere.com",
    phone: "07700900055",
    city: "London",
    license: "UK-44556677",
  },
  {
    name: "Kieran Cooper",
    email: "kieran@rentalsphere.com",
    phone: "07700900066",
    city: "Manchester",
    license: "UK-11223344",
  },
  {
    name: "Sophie Watson",
    email: "sophie@rentalsphere.com",
    phone: "07700900099",
    city: "London",
    license: "UK-66778899",
  },
  {
    name: "Aaron Perry",
    email: "aaron@rentalsphere.com",
    phone: "07700900100",
    city: "London",
    license: "UK-88776655",
  },
];

const querySubjects = [
  {
    subject: "Winter Tyres Availability",
    message: "Do your SUVs come with winter tyres for Highland travel?",
  },
  {
    subject: "Heathrow Airport Pickup details",
    message: "Is it possible to drop off the Fortuner directly at London Heathrow Airport?",
  },
  {
    subject: "Insurance coverage query",
    message: "What does the maximum insurance cover in case of dent or scratches on country lanes?",
  },
  {
    subject: "Rent with driver option",
    message: "Do you offer a driver along with the rental option? If yes, what is the daily rate?",
  },
  {
    subject: "Mileage limitations",
    message: "Are there any daily mileage limits, or is it unlimited driving within the UK?",
  },
  {
    subject: "Pannier bags availability",
    message:
      "Are the Himalayan bikes equipped with panniers and crash guards before Highland tours?",
  },
  {
    subject: "Booking cancellation refund",
    message:
      "If I cancel my booking 24 hours in advance, do I get a full refund to my payment card?",
  },
  {
    subject: "License requirements for US citizens",
    message: "Is a US driving license fully accepted to rent a car in the UK?",
  },
  {
    subject: "Extended rental request",
    message: "I need a vehicle for 3 months. Do you offer long-term corporate rates?",
  },
  {
    subject: "Payment confirmation issue",
    message:
      "I initiated a card payment but the page got disconnected. How can I verify my booking status?",
  },
];

const locations = ["London", "Edinburgh", "Manchester", "Birmingham"];
const paymentMethods: Array<"Card" | "PayPal" | "Cash"> = ["Card", "PayPal", "Cash"];
const insurances = ["basic", "plus", "max"];
const coreAddons = ["driver", "gps", "child", "helmet"];

async function seedHistory() {
  await connectDB();
  console.log("🌱 Starting Historical Database Seeding...");

  // 1. Seed Vehicles
  const seededVehicles: any[] = [];
  for (const v of vehicleData) {
    const doc = await Vehicle.findOneAndUpdate({ slug: v.slug }, v, { upsert: true, new: true });
    seededVehicles.push(doc);
  }
  console.log(`✅ Upserted ${seededVehicles.length} vehicles.`);

  // 2. Seed Admin User
  const adminExists = await User.findOne({ role: "admin" });
  let adminId: mongoose.Types.ObjectId;
  if (!adminExists) {
    const admin = await User.create({
      name: "RentalSphere Admin",
      email: "admin@rentalsphere.com",
      password: "Admin@1234",
      role: "admin",
      isActive: true,
    });
    adminId = admin._id;
    console.log("✅ Admin created: admin@rentalsphere.com / Admin@1234");
  } else {
    adminId = adminExists._id;
    console.log("ℹ️ Admin already exists.");
  }

  // 3. Clear existing historical data to prevent duplicate bloat (Safe target matching)
  await User.deleteMany({ email: { $regex: /@(drivenepal|rentalsphere)\.com$/ }, role: "user" });
  await Booking.deleteMany({});
  await Query.deleteMany({});
  console.log("🧹 Cleaned up old mock users, bookings, and queries.");

  // 4. Create Mock Users
  const seededUsers: any[] = [];
  for (const u of mockUserData) {
    const userDoc = await User.create({
      ...u,
      password: "Password123!",
      role: "user",
      isActive: true,
      authProvider: "local",
    });
    seededUsers.push(userDoc);
  }
  console.log(`✅ Seeded ${seededUsers.length} mock users.`);

  // 5. Generate Bookings Over Last 90 Days
  console.log("🕒 Generating 60 historical bookings...");
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const user = seededUsers[Math.floor(Math.random() * seededUsers.length)];
    const vehicle = seededVehicles[Math.floor(Math.random() * seededVehicles.length)];

    // Distribute bookings across the last 90 days
    const daysOffset = Math.floor(Math.random() * 90);
    const bookingDate = new Date();
    bookingDate.setDate(now.getDate() - daysOffset);

    // Duration of rental (1 to 7 days)
    const rentalDays = Math.floor(Math.random() * 6) + 1;

    const startDateObj = new Date(bookingDate);
    const endDateObj = new Date(bookingDate);
    endDateObj.setDate(startDateObj.getDate() + rentalDays);

    const startDateStr = startDateObj.toISOString().split("T")[0];
    const endDateStr = endDateObj.toISOString().split("T")[0];

    const pickup = locations[Math.floor(Math.random() * locations.length)];
    const dropoff =
      Math.random() > 0.7 ? locations[Math.floor(Math.random() * locations.length)] : pickup;

    // Choose status
    let status: "upcoming" | "active" | "completed" | "cancelled" = "completed";
    if (startDateObj > now) {
      status = "upcoming";
    } else if (startDateObj <= now && endDateObj >= now) {
      status = "active";
    } else {
      status = Math.random() > 0.85 ? "cancelled" : "completed";
    }

    const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const insurance = insurances[Math.floor(Math.random() * insurances.length)];

    // Select dynamic addons
    const selectedAddons: string[] = [];
    if (Math.random() > 0.4) {
      selectedAddons.push(coreAddons[Math.floor(Math.random() * coreAddons.length)]);
    }

    // Pricing calculation
    const insurancePrices: Record<string, number> = { basic: 0, plus: 4, max: 8 };
    const addonPrices: Record<string, number> = { driver: 18, gps: 2, child: 2, helmet: 1 };

    const insurancePrice = insurancePrices[insurance] ?? 0;
    const addonsPrice = selectedAddons.reduce((sum, id) => sum + (addonPrices[id] ?? 0), 0);

    const subtotal = vehicle.pricePerDay * rentalDays + (insurancePrice + addonsPrice) * rentalDays;
    const serviceFee = Math.round(subtotal * 0.05);
    const dropOffFee = dropoff !== pickup ? 8 : 0;
    const vat = Math.round((subtotal + dropOffFee) * 0.13);
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0; // 10% coupon
    const total = subtotal + serviceFee + vat + dropOffFee - discount;

    const booking = await Booking.create({
      user: user._id,
      vehicle: vehicle._id,
      vehicleName: vehicle.name,
      vehicleImage: vehicle.image,
      vehicleSlug: vehicle.slug,
      pickup,
      dropoff,
      startDate: startDateStr,
      endDate: endDateStr,
      days: rentalDays,
      subtotal,
      serviceFee,
      vat,
      discount,
      total,
      status,
      payment,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      license: user.license,
      couponCode: discount > 0 ? "DRIVE10" : undefined,
      insurance,
      addons: selectedAddons,
      serverValidated: true,
    });

    // Manually force DB timestamps to the historical date
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { createdAt: bookingDate, updatedAt: bookingDate } },
    );
  }
  console.log("✅ Generated 60 bookings with accurate timestamps and stats.");

  // 6. Seed Contact Queries
  console.log("✉️ Generating 12 support queries...");
  for (let i = 0; i < 12; i++) {
    const user = seededUsers[Math.floor(Math.random() * seededUsers.length)];
    const qData = querySubjects[Math.floor(Math.random() * querySubjects.length)];

    const daysOffset = Math.floor(Math.random() * 90);
    const queryDate = new Date();
    queryDate.setDate(now.getDate() - daysOffset);

    const isReplied = Math.random() > 0.4;
    let reply: string | undefined;
    let repliedAt: Date | undefined;

    if (isReplied) {
      reply = `Hello ${user.name}, thank you for reaching out. Regarding your inquiry on '${qData.subject}': Yes, we fully support this. Let us know if you need any additional assistance. Best, RentalSphere Team.`;
      repliedAt = new Date(queryDate);
      repliedAt.setHours(repliedAt.getHours() + Math.floor(Math.random() * 24) + 1);
    }

    const query = await Query.create({
      user: Math.random() > 0.2 ? user._id : undefined, // Some guest queries, some authenticated
      name: user.name,
      email: user.email,
      subject: qData.subject,
      message: qData.message,
      reply,
      isReplied,
      repliedAt,
    });

    await Query.updateOne(
      { _id: query._id },
      { $set: { createdAt: queryDate, updatedAt: queryDate } },
    );
  }
  console.log("✅ Generated 12 customer support tickets.");

  console.log("🏁 Database Seeding Successful!");
  await mongoose.disconnect();
}

seedHistory().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
