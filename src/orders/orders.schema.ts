
import { z } from "zod";

/* ================= COMMON ================= */

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

export const TimestampSchema = z
  .union([z.string(), z.date()])
  .optional();

/* ================= CREATE ================= */

export const CreateOrderSchema = z.object({
  id: UUIDSchema.optional(),

  created_at: TimestampSchema,

  user_id: UUIDSchema,

  store_id: UUIDSchema,

  rider_id: UUIDSchema,

  status: z
    .string()
    .min(2, "Status is required")
    .max(50, "Status cannot exceed 50 characters"),

  total_price: z
    .number()
    .min(0, "Total price cannot be negative"),

  delivery_fee: z
    .number()
    .min(0)
    .default(0),

  surge_fee: z
    .number()
    .min(0)
    .default(0),

  discount_amount: z
    .number()
    .min(0)
    .default(0),

  tax_amount: z
    .number()
    .min(0)
    .default(0),

  final_amount: z
    .number()
    .min(0),

  payment_status: z
    .string()
    .min(2)
    .max(30),

  payment_id: UUIDSchema,

  otp: z
    .number()
    .int()
    .min(1000)
    .max(999999),

  address_snapshot: z
    .string()
    .min(5)
    .max(1000),
});

/* ================= UPDATE ================= */

export const UpdateOrderSchema =
  CreateOrderSchema.partial();

/* ================= QUERY ================= */

export const QueryOrderSchema = z.object({
  id: UUIDSchema.optional(),

  user_id: UUIDSchema.optional(),

  store_id: UUIDSchema.optional(),

  rider_id: UUIDSchema.optional(),

  status: z.string().optional(),

  payment_status: z.string().optional(),

  payment_id: UUIDSchema.optional(),

  created_at: TimestampSchema,
});

/* ================= TYPES ================= */

export type CreateOrderDto = z.infer<
  typeof CreateOrderSchema
>;

export type UpdateOrderDto = z.infer<
  typeof UpdateOrderSchema
>;

export type QueryOrderDto = z.infer<
  typeof QueryOrderSchema
>;