import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { infoAgent, systemMessage } from "../service/monitor";
import { MonitorTargetSchema } from "../types/schema";

// MCP 工具参数 schema
const monitorInputSchema = z.object({
  command: z.string().describe("用户监控请求，如：监控BTC价格"),
  notifyMethod: z.enum(["email", "sms"]).describe("通知方式"),
  notifyAddress: z.string().describe("通知地址"),
});

// 创建 MCP Server
const server = new McpServer({
  name: "MonitorMCPServer",
  version: "1.0.0",
});
const target: MonitorTarget = {
  name: "Monitor",
  command: "监控BTC价格",
  judge: ">20000",
  intervalMinutes: 10,
  notifyMethod: "email",
  notifyAddress: "fzxs12345@163.com",
};

// 注册 monitor 工具
server.tool(
  "monitor",
  monitorInputSchema.shape,
  async ({ command, notifyMethod, notifyAddress }) => {
    // 构造初始 state
    const state = {
      messages: [
        { type: "system", content: systemMessage },
        { type: "user", content: command },
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