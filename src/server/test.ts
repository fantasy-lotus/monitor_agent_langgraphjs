import { infoAgent, systemMessage } from "../service/monitor.ts";
import { MonitorTargetSchema } from "../types/schema.ts";
import { parseUserInstruction } from "../agents/planAgent.ts";

const test = async (input: string) => {
  const target = await parseUserInstruction({
    input,
    schema: MonitorTargetSchema,
  });
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
  "监控比特币价格，当超过50000美元时通知我，我的邮箱是gilgamesh258@qq.com"
);
