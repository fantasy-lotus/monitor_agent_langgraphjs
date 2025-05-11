import z from "zod";

export const FetchInfoSchema = z.object({
  command: z
    .string()
    .describe("fetch command which will be web search engine input"),
  complexity: z
    .enum(["simple", "complex"])
    .default("simple")
    .describe("fetch complexity"),
  type: z.enum(["price", "news", "general", "technology"]).default("general"),
});

export type FetchInfo = z.infer<typeof FetchInfoSchema>;

export function fetchInfoToString(fetchInfo: FetchInfo): string {
  return `command: ${fetchInfo.command}, complexity: ${fetchInfo.complexity}, type: ${fetchInfo.type}`;
}
