import { monitorGraph } from "../graph/monitorGraph";
import * as dotenv from "dotenv";

dotenv.config(); // * init env
const email = "lotus0721@outlook.com";
const input = "每5分钟监控比特币，一旦高于28000就通知我，我的邮箱是" + email;


console.log("监控任务已启动");
// 运行示例
(async () => {
  const graph = await monitorGraph();
  // 正确方式：传入格式化的对象
  const result = await graph.invoke({content: input});
  console.log("监控任务完成，结果:", result);
})();
