import { z } from "zod";

/* ================= BASE ================= */

export const UserRoleEnum = z.enum(["customer", "rider", "admin"]);

export const UUIDSchema = z
  .string()
  .uuid({ message: "Invalid UUID format" });

export const TimestampSchema = z
  .union([z.string(), z.date()])
  .optional();

/* ================= CREATE ================= */

export const CreateUserSchema = z.object({
  id: UUIDSchema.optional(),

  created_at: TimestampSchema,

  name: z
    .string()
    .min(2, "Name must be at least 2 chars")
    .max(100),

  email: z
    .string()
    .email("Invalid email format"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

  role: UserRoleEnum.default("customer"),

  is_premium: z.boolean().optional().default(false),
});

/* ================= UPDATE ================= */

export const UpdateUserSchema = CreateUserSchema.partial();

/* ================= QUERY ================= */

export const QueryUserSchema = z.object({
  id: UUIDSchema.optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: UserRoleEnum.optional(),
});

/* ================= TYPES ================= */

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type QueryUserDto = z.infer<typeof QueryUserSchema>;