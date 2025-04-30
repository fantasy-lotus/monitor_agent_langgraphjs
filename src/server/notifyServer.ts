import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { notifySchema, sendNotification } from "../tools/notifyTool.ts";

// 创建 MCP Server
const notifyServer = new McpServer({
  name: "NotifyServer",
  version: "0.0.1",
  capabilities: {
    tools: {}
  }
});

notifyServer.tool(
  "notify",
  "send notification by email",
  notifySchema.shape,
  async (params: { method: "email" | "sms"; to: string; content: string }) => {
    const { method, to, content } = params;
    await sendNotification({ method, to, content });
    return {
      content: [
        { type: "text", text: "通知已发送" }
      ]
    };
  }
);

export default notifyServer;