import express from "express";
import notifyServer from "./notifyServer";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import axios from "axios";
import { Request, Response, NextFunction } from "express";

//server with tool
const server = notifyServer;

// Express + SSE setup
const app = express();
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;

  console.log("SSE session started:", transport.sessionId);

  res.on("close", () => {
    console.log("SSE session closed:", transport.sessionId);
    delete transports[transport.sessionId];
  });

  res.on("error", (err) => {
    console.error("SSE connection error:", err);
    delete transports[transport.sessionId];
  });

  try {
    await server.connect(transport);
  } catch (err) {
    console.error("Error in SSE connect:", err);
    res.status(500).end();
  }
});

app.post("/messages", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  } catch (err) {
    console.error("Error in /notify:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});

interface ErrorResponse {
  error: string;
}

const PORT = process.env.PORT || 4888;

app.listen(PORT);
