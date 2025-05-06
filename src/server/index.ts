// mcp-sse-server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import server from "../mcp/monitor.ts";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*", //allowed origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 在请求入口添加日志中间件
app.use((req, res, next) => {
  console.info(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const transports = {
  sse: {} as Record<string, SSEServerTransport>,
};

app.get("/sse", async (req, res) => {
  console.info(`[${new Date().toISOString()}] [INFO] Received SSE message:`, {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers,
  });
  // Create SSE transport for legacy clients
  const transport = new SSEServerTransport("/messages", res);
  transports.sse[transport.sessionId] = transport;

  await server.connect(transport);
  res.on("close", () => {
    delete transports.sse[transport.sessionId];
  });
});

// Legacy message endpoint for older clients
app.post("/messages", async (req, res) => {
  console.info(
    `[${new Date().toISOString()}] [INFO] Received legacy message:`,
    {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
    }
  );
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(
    `[${new Date().toISOString()}] [ERROR] ${req.method} ${req.url} -`,
    err.stack || err.message
  );
  res.status(500).json({
    jsonrpc: "2.0",
    error: {
      code: -32603,
      message: "Internal server error",
    },
    id: null,
  });
});

// 优雅关闭所有连接
async function closeAllConnections() {
  const sseConnections = transports.sse; // 获取 SSE 连接对象
  const connectionCount = Object.keys(sseConnections).length; // 获取连接数量
  console.log(
    `[${new Date().toISOString()}] 关闭所有连接 (${connectionCount}个)`
  );
  // 遍历 SSE 连接
  for (const [id, transport] of Object.entries(sseConnections)) {
    try {
      // 关闭 SSE 连接
      if (typeof transport.close === "function") {
        await transport.close();
      }
      console.log(`[${new Date().toISOString()}] 已关闭连接: ${id}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 关闭连接失败: ${id}`, error);
    }
  }
  transports.sse = {}; // 清空 SSE 连接记录
}

process.on("SIGINT", async () => {
  console.log(`[${new Date().toISOString()}] 接收到SIGINT信号，准备关闭`);
  await closeAllConnections();
  process.exit(0);
});

// 启动服务器
const port = process.env.PORT || 8721;
const myServer = app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] MCP SSE 服务器已启动，地址: http://localhost:${port}`
  );
  console.log(`- SSE 连接端点: http://localhost:${port}/sse`);
  console.log(`- 消息处理端点: http://localhost:${port}/messages`);
  console.log(`- 健康检查端点: http://localhost:${port}/health`);
});
