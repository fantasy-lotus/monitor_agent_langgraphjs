import { infoAgent, systemMessage } from "../service/fetchInfo.ts";
import { FetchInfo, fetchInfoToString } from "../types/fetch.ts";

const commands = [
  {
    command: "summary latest world hot news",
    complexity: "simple",
    type: "news",
  },
  {
    command: "get current weather in Beijing",
    complexity: "simple",
    type: "weather",
  },
  {
    command: "summarize top 5 AI research papers in 2025",
    complexity: "complex",
    type: "research",
  },
  {
    command: "list top trending stocks today",
    complexity: "simple",
    type: "finance",
  },
  {
    command: "summarize NBA playoff results",
    complexity: "simple",
    type: "sports",
  },
];

for (const cmd of commands) {
  const target: FetchInfo = {
    command: cmd.command,
    complexity: cmd.complexity as FetchInfo["complexity"],
    type: cmd.type as FetchInfo["type"],
  };
  // eslint-disable-next-line no-await-in-loop
  const res = await infoAgent.invoke({
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: fetchInfoToString(target) },
    ],
    target,
  });
  console.log(`command: ${cmd.command}`);
  console.log("res", res.messages[res.messages.length - 1].content);
  console.log("----------------------");
}
