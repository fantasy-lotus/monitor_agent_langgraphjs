// fetchTool.ts
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const fetchSchema = z.object({
  type: z.enum(["crypto", "stock", "gold"]).describe("monitor type"),
  symbol: z.string().describe("monitor symbol"),
});

// 原始函数
const fetchByApi = async ({
  type,
  symbol,
}: z.infer<typeof fetchSchema>): Promise<number> => {
  if (type === "crypto") {
    const res = await fetch("https://api.api-ninjas.com/v1/bitcoin", {
      method: "GET",
      headers: {
        "X-Api-Key": process.env.NINJA_API_KEY || "",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("获取比特币价格失败");
    }
    const json = await res.json();
    return parseFloat(json.price);
  } else if (type === "stock") {
    const res = await fetch(
      `https://api.api-ninjas.com/v1/stockprice?ticker=${symbol}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": process.env.NINJA_API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`获取${symbol}股票价格失败`);
    }
    const json = await res.json();
    return parseFloat(json.price);
  }
  throw new Error("不支持的类型");
};

// 包装为 LangChain 工具
export const fetchByApiTool = tool(fetchByApi, {
  name: "fetch_price_by_api",
  description: "根据类型和代码获取加密货币或股票的最新价格",
  schema: fetchSchema,
});
