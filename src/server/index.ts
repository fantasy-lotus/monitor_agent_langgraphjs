import { monitorGraph } from "../graph/monitorGraph";
import * as dotenv from "dotenv";
import { createParserTool } from "../tools/parserStructruedTool";
import { MonitorTargetSchema } from "../types/schema";
import { model } from "../llms/openai";

dotenv.config(); // * init env
const email = "lotus0721@outlook.com";
const input = "每5分钟监控英伟达，我的邮箱是" + email;


console.log("监控任务已启动");
// 运行示例
// (async () => {
//   const graph = await monitorGraph();
//   // 正确方式：传入格式化的对象
//   const result = await graph.invoke({content: input});
//   console.log("监控任务完成，结果:", result);
// })();

const tool = createParserTool(MonitorTargetSchema);


(async () => {
  const res = await tool.invoke({ input });
  console.log("解析结果:", res);
})();