/**
 * Request validation schemas using Zod
 *
 * Validates incoming proxy requests before making Claude API calls.
 * Implementation: pb-if7 (Request Validation)
 */

import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().max(200),
  price: z.number().positive().max(100000),
  category: z.string().max(50),
});

export const ContextSchema = z.object({
  localDateTime: z.string().datetime(), // ISO 8601 datetime from client
  goalName: z.string().max(100).nullable(),
  recentPurchaseCount: z.number().int().min(0).max(100),
  frictionLevel: z.number().int().min(1).max(5),
});

export const ReflectionRequestSchema = z.object({
  product: ProductSchema,
  context: ContextSchema,
});

export type ReflectionRequest = z.infer<typeof ReflectionRequestSchema>;

export function validateRequest(body: unknown) {
  const result = ReflectionRequestSchema.safeParse(body);

  if (!result.success) {
    return {
      valid: false as const,
      errors: result.error.flatten(),
    };
  }

  return {
    valid: true as const,
    data: result.data,
  };
}
