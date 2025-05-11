import * as dotenv from "dotenv";
import { FetchInfo } from "../types/fetch.ts";
import { model } from "../llms/openai.ts";
import { fetchByApiTool } from "../tools/fetchTool.ts";
import { TavilyExtract } from "@langchain/tavily";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { SerpAPI } from "@langchain/community/tools/serpapi";
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
  target: Annotation<FetchInfo>, // 监控目标
});

const tool = new SerpAPI(process.env.SERPAPI_KEY, {
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
You are a web information fetch agent.
Your goals:
- Understand the user's intent from the command field and select the most appropriate tool or combination of tools.
- You must use the tools provided to you to fetch information, especially real-time info.
- If you need to call a web tool, first rewrite the user's command into a query that is more suitable for browser/web search.
- For 'general' type or other open-ended queries, use SerpAPI first to get short information. If SerpAPI cannot return enough information, use Exa Search as needed. If more detailed extraction is needed, use Tavily Extract.
- Use the complexity field to decide whether to use simple or more advanced search/extraction tools.
- If the info from tool is not clear, you must use other tool to search the info.You need to keep quality but not speed.
- Always return clear, concise, and actionable results based on the tool_call results.
- The current time is ${realTime}.
Respond in English unless the user input are other Language.
`;
