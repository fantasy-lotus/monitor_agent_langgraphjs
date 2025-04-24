// types/schema.ts
import { z } from "zod";

export const MonitorTargetSchema = z.object({
  name: z.string().describe("monitor name"),
  command: z.string().describe("task command"),
  judge: z.string().optional().describe("monitor task judge"),
  intervalMinutes: z.number().default(20).describe("monitor task interval minutes"),
  notifyMethod: z.enum(['email', 'sms']).default('email').describe("notify method"),
  notifyAddress: z.string().describe("notify address"),
});

export type MonitorTarget = z.infer<typeof MonitorTargetSchema>;