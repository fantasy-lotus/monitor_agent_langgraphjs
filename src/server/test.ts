import { infoAgent, systemMessage } from "../service/monitor.ts";
import { MonitorTargetSchema } from "../types/schema.ts";
import { parseUserInstruction } from "../service/schedule.ts";

const test = async (input: string) => {
  const target = await parseUserInstruction({
    input,
    schema: MonitorTargetSchema,
  });
  if (!target) {
    console.log("解析失败");
    return;
  }
  const res = await infoAgent.invoke({
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: target.command },
    ],
    target,
  });
  console.log("res", res.messages[res.messages.length - 1].content);
};

await test(
  "查寻比特币价格，大于100000，并将结果发送到我的邮箱 weather_report@example.com"
);
