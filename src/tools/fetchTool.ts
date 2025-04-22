// ✅ fetchTool.ts
import { z } from "zod";
import { MonitorTargetSchema } from "../types/schema";

export const fetchSchema = z.object({
  type: MonitorTargetSchema.shape.type,
  symbol: MonitorTargetSchema.shape.symbol,
});

export const fetchByTool = async ({ type, symbol }: z.infer<typeof fetchSchema>): Promise<number> => {
  if (type === "crypto") {
    const res = await fetch("https://api.api-ninjas.com/v1/bitcoin", {
      method: "GET",
      headers: {
        "X-Api-Key": process.env.NINJA_API_KEY || "",
        "Content-Type": "application/json",
      },
    }
    );
    if (!res.ok) {
      throw new Error("获取比特币价格失败");
    }
    const json = await res.json();
    return parseFloat(json.price);
  }
  else if(type === "stock") {
    const res = await fetch(`https://api.api-ninjas.com/v1/stockprice?ticker=${symbol}`, {
      method: "GET",
      headers: {
        "X-Api-Key": process.env.NINJA_API_KEY || "",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`获取${symbol}股票价格失败`);
    }
    const json = await res.json();
    return parseFloat(json.price);
  }
  // else if(type === "gold") {
  //   const res = await fetch("https://api.api-ninjas.com/v1/goldprice", {
  //     method: "GET",
  //     headers: {
  //       "X-Api-Key": process.env.NINJA_API_KEY || "",
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   if (!res.ok) {
  //     throw new Error("获取黄金价格失败");
  //   }
  //   const json = await res.json();
  //   return parseFloat(json.price);
  // }
  throw new Error("不支持的类型");
};
