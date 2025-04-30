import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
dotenv.config();
// Create client and connect to server
const client = new MultiServerMCPClient({
  // Global tool configuration options
  // Whether to throw on errors if a tool fails to load (optional, default: true)
  throwOnLoadError: true,
  // Whether to prefix tool names with the server name (optional, default: true)
  prefixToolNameWithServerName: true,
  // Optional additional prefix for tool names (optional, default: "mcp")
  additionalToolNamePrefix: "mcp",

  // Server configuration
  mcpServers: {
    // SSE transport example with reconnection configuration
    notify: {
      transport: "sse",
      url: process.env.MCP_NOTIFY_URL || "http://localhost:3000/notify",
      useNodeEventSource: true,
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        delayMs: 2000,
      },
    },
  },
});

const tools = await client.getTools();

// Create an OpenAI model
const model = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
});

// Create the React agent
const agent = createReactAgent({
  llm: model,
  tools,
});

// Run the agent
try {
  const mathResponse = await agent.invoke({
    messages: [{ role: "user", content: "send email hello to 3196420748@qq.com" }],
  });
  console.log(mathResponse);
} catch (error) {
  console.error("Error during agent execution:", error);
  // Tools throw ToolException for tool-specific errors
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "ToolException"
  ) {
    console.error("Tool execution failed:", (error as { message?: unknown }).message);
  }
}

await client.close();