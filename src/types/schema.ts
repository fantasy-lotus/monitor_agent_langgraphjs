// types/schema.ts
import { z } from "zod";

export const MonitorTargetSchema = z.object({
  name: z.string().describe("fatch info name"),
  command: z
    .string()
    .describe("fetch command which will be search engine input"),
  judge: z.string().optional().describe("monitor info notify judge"),
  intervalMinutes: z
    .number()
    .default(20)
    .describe("monitor task interval minutes"),
  notifyMethod: z
    .enum(["email", "sms"])
    .default("email")
    .describe("notify method"),
  notifyAddress: z.string().describe("notify address"),
});

export type MonitorTarget = z.infer<typeof MonitorTargetSchema>;
