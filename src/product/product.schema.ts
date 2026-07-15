
import { z } from "zod";

/* ================= COMMON ================= */

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

export const TimestampSchema = z
  .union([z.string(), z.date()])
  .optional();

/* ================= CREATE ================= */

export const CreateProductSchema = z.object({
  id: UUIDSchema.optional(),

  store_id: UUIDSchema,

  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name cannot exceed 100 characters"),

  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0"),

  category: z
    .string()
    .min(2, "Category is required")
    .max(100, "Category cannot exceed 100 characters"),

  is_available: z
    .boolean()
    .default(true),

  is_veg: z
    .boolean()
    .default(false),

  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .default(0),

  add_ons: z
    .record(z.string(), z.number())
    .default({}),
});

/* ================= UPDATE ================= */

export const UpdateProductSchema =
  CreateProductSchema.partial();

/* ================= QUERY ================= */

export const QueryProductSchema = z.object({
  id: UUIDSchema.optional(),

  store_id: UUIDSchema.optional(),

  name: z.string().optional(),

  category: z.string().optional(),

  is_available: z.boolean().optional(),

  is_veg: z.boolean().optional(),

  stock: z.number().optional(),

  price: z.number().optional(),
});

/* ================= TYPES ================= */

export type CreateProductDto = z.infer<
  typeof CreateProductSchema
>;

export type UpdateProductDto = z.infer<
  typeof UpdateProductSchema
>;

export type QueryProductDto = z.infer<
  typeof QueryProductSchema
>;