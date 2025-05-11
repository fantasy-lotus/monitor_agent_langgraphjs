import { infoAgent, systemMessage } from "../service/fetchInfo.ts";
import { FetchInfo, fetchInfoToString } from "../types/fetch.ts";

const target: FetchInfo = {
  command: "summary latest world hot news",
  complexity: "simple",
  type: "news",
};
const res = await infoAgent.invoke({
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: fetchInfoToString(target) },
  ],
  target,
});

console.log("res", res.messages[res.messages.length - 1].content);
