// types/schema.ts
import { z } from "zod";

export const MonitorTargetSchema = z.object({
  type: z.enum(['crypto', 'stock', 'gold']),
  symbol: z.string(),
  threshold: z.number(),
  direction: z.enum(['above', 'below']),
  intervalMinutes: z.number(),
  notifyMethod: z.enum(['email', 'sms']).default('email'),
  notifyAddress: z.string(),
});

export type MonitorTarget = z.infer<typeof MonitorTargetSchema>;