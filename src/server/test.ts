import { infoAgent, systemMessage } from "../service/monitor.ts";
import { MonitorTarget } from "../types/schema.ts";
const target: MonitorTarget = {
  name: "Monitor",
  command: "监控BTC价格",
  judge: ">20000",
  intervalMinutes: 10,
  notifyMethod: "email",
  notifyAddress: "fzxs12345@163.com",
};
infoAgent.invoke({
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: target.command },
  ],
  target,
});
