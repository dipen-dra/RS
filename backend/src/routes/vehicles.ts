import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Vehicle } from "../models/Vehicle.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { upload } from "../middleware/upload.js";

const router = Router();

/* ── GET /api/vehicles ──────────────────────────────────── */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { type, category, location, maxPrice, sort, q } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { isAvailable: true };

  if (type) filter.type = type;
  if (category && category !== "All") filter.category = category;
  if (location) filter.location = location;
  if (maxPrice) filter.pricePerDay = { $lte: Number(maxPrice) };
  if (q)
    filter.$or = [{ name: { $regex: q, $options: "i" } }, { brand: { $regex: q, $options: "i" } }];

  let query = Vehicle.find(filter);

  if (sort === "price-asc") query = query.sort({ pricePerDay: 1 });
  else if (sort === "price-desc") query = query.sort({ pricePerDay: -1 });
  else if (sort === "rating") query = query.sort({ rating: -1 });
  else query = query.sort({ reviews: -1 }); // default: popular

  const vehicles = await query.lean();
  res.json({ success: true, data: vehicles });
});

/* ── GET /api/vehicles/:slug ────────────────────────────── */
router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  const vehicle = await Vehicle.findOne({ slug: req.params.slug }).lean();
  if (!vehicle) {
    res.status(404).json({ success: false, message: "Vehicle not found." });
    return;
  }
  res.json({ success: true, data: vehicle });
});

/* ── POST /api/vehicles (admin) ─────────────────────────── */
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    // Parse form-data body
    const body = { ...req.body };
    if (body.pricePerDay) body.pricePerDay = Number(body.pricePerDay);
    if (body.seats) body.seats = Number(body.seats);
    if (body.rating) body.rating = Number(body.rating);
    if (body.reviews) body.reviews = Number(body.reviews);
    if (typeof body.features === "string") {
      try {
        body.features = JSON.parse(body.features);
      } catch (e) {
        body.features = body.features.split(",");
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files?.image?.[0]) {
      body.image = files.image[0].path;
    }

    if (files?.gallery?.length) {
      body.gallery = files.gallery.map((f) => f.path);
    }

    const existing = await Vehicle.findOne({ slug: body.slug });
    if (existing) {
      res.status(409).json({ success: false, message: "Vehicle with this slug already exists." });
      return;
    }

    const vehicle = await Vehicle.create(body);
    res.status(201).json({ success: true, data: vehicle });
  },
);

/* ── PUT /api/vehicles/:id (admin) ─────────────────────── */
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const body = { ...req.body };
    if (body.pricePerDay) body.pricePerDay = Number(body.pricePerDay);
    if (body.seats) body.seats = Number(body.seats);
    if (body.rating) body.rating = Number(body.rating);
    if (body.reviews) body.reviews = Number(body.reviews);
    if (typeof body.features === "string") {
      try {
        body.features = JSON.parse(body.features);
      } catch (e) {
        body.features = body.features.split(",");
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files?.image?.[0]) {
      body.image = files.image[0].path;
    }

    if (files?.gallery?.length) {
      // If adding new gallery images, you might want to append or replace. Replacing for simplicity here.
      body.gallery = files.gallery.map((f) => f.path);
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." });
      return;
    }
    res.json({ success: true, data: vehicle });
  },
);

/* ── DELETE /api/vehicles/:id (admin) ───────────────────── */
router.delete(
  "/:id",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." });
      return;
    }
    res.json({ success: true, message: "Vehicle deleted." });
  },
);

export default router;
