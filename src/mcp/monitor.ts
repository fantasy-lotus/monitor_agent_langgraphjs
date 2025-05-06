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
  async (target: MonitorTarget) => {
    // 构造初始 state
    const state = {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: target.command },
      ],
      target,
    };
    // 执行监控流程
    const result = await infoAgent.invoke(state);

    // 获取最终消息（通常是数组最后一个）
    const finalMessage = result.messages[result.messages.length - 1];

    // 检查 finalMessage 是否存在且有 content
    const finalContent = finalMessage?.content ?? "未能获取到最终信息";

    return {
      content: [
        {
          type: "text",
          // 使用最后一个消息的内容
          text: "监控流程执行完毕: " + finalContent + "\n 等待发送通知...",
        },
      ],
    };
  }
);

// 启动 MCP Server（本地用 stdio，生产可用 http/sse）
const transport = new StdioServerTransport();
server.connect(transport);

console.log("MCP Monitor Server running (STDIO)...");

export default server;
