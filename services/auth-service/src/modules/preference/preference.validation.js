import { z } from "zod";

export const updatePreferenceSchema = z.object({
  body: z
    .object({
      reportingCurrency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .optional(),

      timeZone: z.string().min(1).max(100).optional(),

      dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),

      language: z.enum(["en", "hi", "fr", "es"]).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one preference is required",
    }),
});
