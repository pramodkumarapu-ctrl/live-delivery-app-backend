
import { z } from "zod";

/* ================= COMMON ================= */

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

/* ================= CREATE ================= */

export const CreateRiderProfileSchema = z.object({
  rider_id: UUIDSchema,

  vehicle_type: z
    .string()
    .min(2, "Vehicle type is required")
    .max(50, "Vehicle type cannot exceed 50 characters"),

  rating: z
    .number()
    .min(0)
    .max(5)
    .default(0),

  total_orders: z
    .number()
    .int()
    .min(0)
    .default(0),

  current_status: z
    .string()
    .min(2, "Current status is required")
    .max(50, "Current status cannot exceed 50 characters"),
});

/* ================= UPDATE ================= */

export const UpdateRiderProfileSchema =
  CreateRiderProfileSchema.partial();

/* ================= QUERY ================= */

export const QueryRiderProfileSchema = z.object({
  rider_id: UUIDSchema.optional(),

  vehicle_type: z.string().optional(),

  rating: z.number().optional(),

  total_orders: z.number().optional(),

  current_status: z.string().optional(),
});

/* ================= TYPES ================= */

export type CreateRiderProfileDto = z.infer<
  typeof CreateRiderProfileSchema
>;

export type UpdateRiderProfileDto = z.infer<
  typeof UpdateRiderProfileSchema
>;

export type QueryRiderProfileDto = z.infer<
  typeof QueryRiderProfileSchema
>;