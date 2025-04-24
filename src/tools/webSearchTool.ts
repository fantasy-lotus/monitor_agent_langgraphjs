import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import z from "zod";

// 定义 schema
export const WebtoolSchema = z.object({
  maxResults: z.number().optional().default(5),
  topic: z.string().optional().default("general"),
  includeAnswer: z.boolean().optional().default(true),
  includeRawContent: z.boolean().optional().default(false),
  includeImages: z.boolean().optional().default(true),
  includeImageDescriptions: z.boolean().optional().default(true),
  searchDepth: z.enum(["basic", "deep"]).optional().default("basic"),
  timeRange: z.enum(["day", "week", "month", "year"]).optional().default("day"),
  includeDomains: z.array(z.string()).optional().default([]),
  excludeDomains: z.array(z.string()).optional().default([]),
});

// 包装 TavilySearch 为 LangChain 工具
export const createWebTool = (
  options: Partial<ConstructorParameters<typeof TavilySearch>[0]> = {}
) => {
  const tavilySearch = new TavilySearch({
    maxResults: 5,
    topic: "general",
    includeAnswer: true,
    includeRawContent: false,
    includeImages: true,
    includeImageDescriptions: true,
    searchDepth: "basic",
    timeRange: "day",
    includeDomains: [],
    excludeDomains: [],
    ...options,
  });

  return tool(
    async ({ input }: { input: string }) => {
      return await tavilySearch.invoke({query: input});
    },
    {
      name: "web_search_tool",
      description: "如果你有不知道或者不太确定的信息，请调用这个工具 TavilySearch 进行网络搜索，特别是实时的信息",
      schema: z.object({
        input: z.string().describe("搜索查询"),
      }),
    }
  );
};
