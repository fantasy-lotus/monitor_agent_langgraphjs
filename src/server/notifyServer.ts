import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { notifySchema, sendNotification } from "../tools/notifyTool";

// 创建 MCP Server
const notifyServer = new McpServer({
  name: "NotifyServer",
  version: "0.0.0",
  capabilities: {
    tools: {}
  }
});

notifyServer.tool(
  "notify",
  "send notification by email",
  notifySchema.shape,
  async ({ method, to, content }) => {
    await sendNotification({ method, to, content });
    return {
      content: [
        { type: "text", text: "通知已发送" }
      ]
    };
  }
);

export default notifyServer;