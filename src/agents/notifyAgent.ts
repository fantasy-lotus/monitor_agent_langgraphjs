// agents/notifyAgent.ts
import { sendNotification, notifySchema } from "../tools/notifyTool";

interface NotifyParams {
  to: string;
  method: string; // 未来可扩展支持 sms、push
  content: string;
}

export const notifyUser = async ({ to, content, method}: NotifyParams) => {
  const validated = notifySchema.parse({
    to,
    method,
    content,
  });
  await sendNotification(validated);
};