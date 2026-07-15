import { z } from "zod";

/* ================= COMMON ================= */

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

export const TimestampSchema = z
  .union([z.string(), z.date()])
  .optional();

/* ================= CREATE ================= */

export const CreateStoreSchema = z.object({
  id: UUIDSchema.optional(),

  created_at: TimestampSchema,

  name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name cannot exceed 100 characters"),

  type: z
    .string()
    .min(2, "Store type is required")
    .max(50, "Store type cannot exceed 50 characters"),

  location: z
    .string()
    .min(2, "Location is required")
    .max(255, "Location cannot exceed 255 characters"),

  lat: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),

  lng: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),

  rating: z
    .number()
    .min(0)
    .max(5)
    .default(0),

  is_open: z
    .boolean()
    .default(true),

  tags: z
    .array(z.string())
    .default([]),
});

/* ================= UPDATE ================= */

export const UpdateStoreSchema =
  CreateStoreSchema.partial();

/* ================= QUERY ================= */

export const QueryStoreSchema = z.object({
  id: UUIDSchema.optional(),

  created_at: TimestampSchema,

  name: z.string().optional(),

  type: z.string().optional(),

  location: z.string().optional(),

  is_open: z.boolean().optional(),

  rating: z.number().optional(),

  tags: z.array(z.string()).optional(),
});

/* ================= TYPES ================= */

export type CreateStoreDto = z.infer<
  typeof CreateStoreSchema
>;

export type UpdateStoreDto = z.infer<
  typeof UpdateStoreSchema
>;

export type QueryStoreDto = z.infer<
  typeof QueryStoreSchema
>;