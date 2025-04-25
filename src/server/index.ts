import { monitorGraph } from "../graph/monitorGraph";
import * as dotenv from "dotenv";
import { createParserTool } from "../tools/parserStructruedTool";
import { MonitorTargetSchema } from "../types/schema";
import { model } from "../llms/openai";
import { createWebTool } from "../tools/webSearchTool";
import { fetchByApiTool } from "../tools/fetchTool";
import { TavilyExtract, TavilySearch } from "@langchain/tavily";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { ToolNode } from "@langchain/langgraph/prebuilt";

dotenv.config(); // * init env
const tool = new SerpAPI();


const extractTool = new TavilyExtract();
const email = "lotus0721@outlook.com";
const input = "每5分钟监控比特币价格》1000，我的邮箱是" + email;
const search = "tell me hows the weather in beijjing now";
const brief = "mcp是昙花一现还是业内标准";
// console.log("监控任务已启动");
// // 运行示例
// (async () => {
//   const graph = await monitorGraph();
//   // 正确方式：传入格式化的对象
//   const result = await graph.invoke({content: nput});
//   console.log("监控任务完成，结果:", resul);
// })();

// const tool = createParserTool(MonitorTargetSchema);

// (async () => {
//   const res = await tool.invoke({ input: search });
//   console.log("解析结果:", res);
// })();
const webTool = createWebTool();
// console.log(tool.includeAnswer);
// (async () => {
//   const res = await tool.invoke({
//     query: search,
//   });
//   console.log("搜索结果:", res);
// })();

const parserTool = createParserTool(MonitorTargetSchema);
const client = new Exa(process.env.EXASEARCH_API_KEY);

const exaTool = new ExaSearchResults({
  client,
  searchArgs: {
    numResults: 3,
    useAutoprompt: true,
    summary: true,
    link: true,
    image: false,
  },
});
const tools = [fetchByApiTool, exaTool, extractTool, tool];
import {
  StateGraph,
  MessagesAnnotation,
  END,
  START,
} from "@langchain/langgraph";

const toolNodeForGraph = new ToolNode(tools);

const modelWithTools = model.bindTools(tools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: response };
};

const workflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", toolNodeForGraph)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END])
  .addEdge("tools", "agent");

const app = workflow.compile();
const realTime = new Date();
const systemMessage = `
Your goals:
- Understand the user's intent and select the most appropriate tool or combination of tools.
- When the user provides a monitoring or alerting request, use the Instruction Parser to extract structured details.
- For price queries, use the Price Fetcher with the correct type and symbol.
- Time now is ${realTime},For general or open-ended questions or realtime question, use SerpAPI first to get short infomation.
- If you SerpAPI can not return enough infomation or For detailed web searches, use Exa Search as needed.
- If other search tools can not return enough infomation or For complex detailed information extraction, use Tavily Extract as needed.
- Always return clear, concise, and actionable results.
- If information is missing, ask the user for clarification.

Respond in English unless the user requests otherwise.
`;

export const testInputs = [

  // 实时信息
  "Get the current price of Bitcoin.",
  "What is the latest stock price of Tesla?",
  "Retrieve the current weather in Shanghai.",
  "Get the latest news headlines about artificial intelligence.",
  "Fetch the current exchange rate between USD and EUR.",

  // 榜单/排行
  "List the top 5 trending cryptocurrencies today.",
  "Get the top 3 most valuable companies in the world.",
  "Show me the most popular programming languages in 2024.",
  "List the top tourist attractions in Tokyo.",
  "What are the best-selling smartphones this year?",

  // 事实/摘要
  "Summarize the latest Apple product launch event.",
  "Get a summary of the most recent Google I/O keynote.",
  "Fetch the main points from the latest UN climate report.",
  "Retrieve the highlights from the latest NBA finals game.",
  "Summarize the key findings from the latest CDC COVID-19 update.",

  // 其他获取类
  "Get the latest exchange rate for Japanese Yen.",
  "Fetch the current gold price per ounce.",
  "Retrieve the latest financial report from Amazon.",
  "Get the current air quality index in Beijing.",
];

(async () => {
  // for (const input of testInputs) {
    const result = await app.invoke({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: brief },
      ],
    });
    console.log(`Input: ${input}\nResult:`, result, "\n---");
  
})();
