import * as dotenv from "dotenv";
import { MonitorTarget } from "../types/schema.ts";
import { model } from "../llms/openai.ts";
import { fetchByApiTool } from "../tools/fetchTool.ts";
import { TavilyExtract } from "@langchain/tavily";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  Annotation,
  StateGraph,
  MessagesAnnotation,
  END,
  START,
} from "@langchain/langgraph";
dotenv.config(); // * init
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  target: Annotation<MonitorTarget>, // 监控目标
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
const tools = [fetchByApiTool, exaTool, extractTool];

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
  return END;
};

const callModel = async (state: typeof StateAnnotation.State) => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: response };
};

const workflow = new StateGraph(StateAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", toolNodeForGraph)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END])
  .addEdge("tools", "agent");

export const infoAgent = workflow.compile();
const realTime = new Date();
export const systemMessage = `
Your goals:
- Understand the user's intent and select the most appropriate tool or combination of tools.
- When the user provides a monitoring or alerting request, use the Instruction Parser to extract structured details.
- For price queries, use the Price Fetcher with the correct type and symbol.
- If you need to call a web tool, first rewrite the user's command into a query that is more suitable for browser/web search.
- Time now is ${realTime}, For general or open-ended questions or realtime question, use Exa Search as needed.
- If other search tools cannot return enough information or for complex detailed information extraction, use Tavily Extract as needed.
- Always return clear, concise, and actionable results.
- If information is missing, ask the user for clarification.
- At last, you need to compare the info with judge field user input, and judge whether send notify or not.

Respond in English unless the user requests otherwise.
`;
