import { monitorGraph } from "../graph/monitorGraph";
import * as dotenv from "dotenv";
import { createParserTool } from "../tools/parserStructruedTool";
import { MonitorTarget, MonitorTargetSchema } from "../types/schema";
import { model } from "../llms/openai";
import { createWebTool } from "../tools/webSearchTool";
import { fetchByApiTool } from "../tools/fetchTool";
import { TavilyExtract, TavilySearch } from "@langchain/tavily";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  Annotation,
  StateGraph,
  MessagesAnnotation,
  StateType,
  END,
  START,
  Messages,
} from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { sendNotification } from "../tools/notifyTool";
dotenv.config(); // * init 
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  target: Annotation<MonitorTarget>, // 监控目标
});

const tool = new SerpAPI(process.env.SERPAPI_API_KEY, {
  num: "3",
  hl: "en",
  gl: "us",
});
const extractTool = new TavilyExtract();
const client = new Exa(process.env.EXASEARCH_API_KEY);
const exaTool = new ExaSearchResults({
  client,
  searchArgs: {
    numResults: 5,
    useAutoprompt: true,
    summary: true,
    link: true,
    image: false,
  },
});
const tools = [fetchByApiTool, exaTool, extractTool, tool];

const toolNodeForGraph = new ToolNode(tools);

const modelWithTools = model.bindTools(tools);

const shouldContinue = (state: typeof StateAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return "notify";
};

async function notifyNode(state: typeof StateAnnotation.State) {
  const { target, messages } = state;
  const message = messages[messages.length - 1];
  await sendNotification({
    method: target?.notifyMethod,
    to: state.target.notifyAddress,
    content: message.content.toString(),
  });
}

const callModel = async (state: typeof StateAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: response };
};

const workflow = new StateGraph(StateAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", toolNodeForGraph)
  .addNode("notify", notifyNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", "notify"])
  .addEdge("notify", END)
  .addEdge("tools", "agent");

export const infoAgent = workflow.compile();
const realTime = new Date();
export const systemMessage = `
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