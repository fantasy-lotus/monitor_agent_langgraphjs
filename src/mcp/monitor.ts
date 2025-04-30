import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { infoAgent, systemMessage } from "../service/monitor.ts";
import { MonitorTarget, MonitorTargetSchema } from "../types/schema.ts";
import dotenv from "dotenv";
dotenv.config(); // * init dotenv

// 创建 MCP Server
const server = new McpServer({
  name: "MonitorMCPServer",
  version: "1.0.0",
});

// 注册 monitor 工具
server.tool(
  "monitor",
  MonitorTargetSchema.shape,
  async ( target: MonitorTarget) => {
    // 构造初始 state
    const state = {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: target.command },
      ],
      target
    };
    // 执行监控流程
    await infoAgent.invoke(state);
    return {
      content: [
        { type: "text", text: "监控流程已完成，通知已发送。" }
      ]
    };
  }
);

// 启动 MCP Server（本地用 stdio，生产可用 http/sse）
const transport = new StdioServerTransport();
server.connect(transport);

console.log("MCP Monitor Server running (STDIO)...");