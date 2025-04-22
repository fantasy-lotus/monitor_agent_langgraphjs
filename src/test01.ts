import * as dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();// * init env

// 检查环境变量
if (!process.env.OPENAI_API_KEY) {
  console.error("错误: 缺少 OPENAI_API_KEY 环境变量");
  process.exit(1);
}

// 修改模型配置，添加streaming: true
const model = new ChatOpenAI({ 
  model: "gpt-4o",
  temperature: 0,
  timeout: 30000,  // 增加超时时间
  streaming: true  // 启用流式处理
});

console.log("连接到 OpenAI API...");

const translateTemplate = "Translate the following to {language}.";
const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", translateTemplate],
    ["user", "{text}"],
]);

// 合并为一个异步函数
  try {
    // 1. 首先生成提示
    console.log("生成提示...");
    const prompt = await promptTemplate.invoke({
      "language": "japanese",
      "text": "生成式人工智能革命已持续两年，研究正推动该领域从“快速思考”（快速预训练响应）向“慢速思考”（推理时进行推理）迈进。这一演变正在解锁一批全新的代理应用。"
    });
    
    // 2. 然后发送流式请求
    console.log("发送流式请求...");
    
    // 使用stream方法而不是invoke
    const stream = await model.stream(prompt.toChatMessages());
    
    const chunks = [];
    // 使用for await循环处理流
    for await (const chunk of stream) {
      chunks.push(chunk);
      console.log(`${chunk.content}|`);
    }
    
    // 可选：输出完整的合并响应
    console.log("\n完整响应:", chunks.map(c => c.content).join(""));
  } catch (error) {
    console.error("API 调用失败:", error);
  } finally {
    console.log("请求完成");
  }