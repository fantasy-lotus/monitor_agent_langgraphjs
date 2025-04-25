import { infoAgent, systemMessage} from "../service/monitor";
import { MonitorTarget } from "../types/schema";
const input = "Get a summary of the most recent us stock market news.";

const target: MonitorTarget = {
  name: "Monitor",
  command: input,
  judge: ">20000",
  intervalMinutes: 10,
  notifyMethod: "email",
  notifyAddress: "fzxs12345@163.com",
};
(async () => {
  // for (const input of testInputs) {
    const result = await infoAgent.invoke({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: target.command },
      ],
      target: target
    });
    console.log(`Input: ${input}\nResult:`, result, "\n---");
})();
