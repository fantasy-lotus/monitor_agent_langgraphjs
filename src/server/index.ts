import { monitorGraph } from "../graph/monitorGraph";
import * as dotenv from "dotenv";
import { createParserTool } from "../tools/parserStructruedTool";
import { MonitorTargetSchema } from "../types/schema";
import { model } from "../llms/openai";
import { createWebTool } from "../tools/webSearchTool";
import { fetchByApiTool } from "../tools/fetchTool";
import { TavilyExtract, TavilySearch } from "@langchain/tavily";
// import * as tslab from "tslab";
import { SerpAPI } from "@langchain/community/tools/serpapi";
process.env.SERPAPI_API_KEY="1c74a880d1f5315d1c7a95f2c0e3da02af9ae471512a37910d3f60e9144752f1";
const tool = new SerpAPI();
// const drawableGraph = await graph.getGraphAsync();
// const image = await drawableGraph.drawMermaidPng();
// const arrayBuffer = await image.arrayBuffer();

// await tslab.display.png(new Uint8Array(arrayBuffer));
dotenv.config(); // * init env
const email = "lotus0721@outlook.com";
const input = "每5分钟监控比特币价格》1000，我的邮箱是" + email;
const search = "hows the weather in beijjing？我的邮箱是" + email + "需要先把用户输入转换为英文结构化语言，最后输出的时候需要恢复到用户原来的语言";
const brief = "summarize today hot news in 5 sentences";
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

//const extractTool = new TavilyExtract();
const parserTool = createParserTool(MonitorTargetSchema);

const tools = [
  parserTool,
  
  fetchByApiTool,
  webTool,
  tool
];
import {
  StateGraph,
  MessagesAnnotation,
  END,
  START
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNodeForGraph = new ToolNode(tools)

const modelWithTools = model.bindTools(tools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
      return "tools";
  }
  return END;
}

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: response };
}


const workflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", toolNodeForGraph)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END])
  .addEdge("tools", "agent");

const app = workflow.compile();

// (async () => {
//   const res = await tool.invoke({ input });
//   console.log("解析结果:", res);
// })();


const search = "how to use tavily";
import { TavilySearch } from "@langchain/tavily";
const tool = new TavilySearch({
  maxResults: 3,
  includeAnswer: true,
}
);
console.log(tool.maxResults);
(async () => {
  const result = await app.invoke({ messages: [input] });
  console.log("最终结果:", result);
})();