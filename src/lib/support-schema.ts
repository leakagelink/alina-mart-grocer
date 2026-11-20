import { z } from "zod";

export const supportSchema = z.object({
  subject: z.string().trim().min(3).max(80),
  message: z.string().trim().min(10).max(2000),
});