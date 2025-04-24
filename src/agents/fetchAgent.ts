// // ✅ agents/fetchAgent.ts
// import {fetchByTool, fetchSchema } from "../tools/fetchTool";
// import { MonitorTarget } from "../types/schema";

// // 根据 MonitorTarget 抓取实时值（如当前价格）
// export const fetchMonitoredValue = async (target: MonitorTarget): Promise<number> => {
//   const parsed = fetchSchema.parse({
//     type: target.type,
//     symbol: target.symbol,
//   });

//   return await fetchByTool(parsed);
// };
