
import { z } from "zod";

/* ================= COMMON ================= */

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

export const TimestampSchema = z
  .union([z.string(), z.date()])
  .optional();

/* ================= CREATE ================= */

export const CreateCartSchema = z.object({
  user_id: UUIDSchema,

  product_id: UUIDSchema,

  quantity: z
    .number()
    .int("Quantity must be integer")
    .min(1, "Minimum quantity is 1"),

  added_at: TimestampSchema,
});

/* ================= UPDATE ================= */

export const UpdateCartSchema =
  CreateCartSchema.partial();

/* ================= QUERY ================= */

export const QueryCartSchema = z.object({
  user_id: UUIDSchema.optional(),

  product_id: UUIDSchema.optional(),

  quantity: z.number().optional(),

  added_at: TimestampSchema,
});

/* ================= TYPES ================= */

export type CreateCartDto =
  z.infer<typeof CreateCartSchema>;

export type UpdateCartDto =
  z.infer<typeof UpdateCartSchema>;

export type QueryCartDto =
  z.infer<typeof QueryCartSchema>;