import { ChatOpenAI } from "@langchain/openai";

// 创建 LLM 实例时添加更多日志
export const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4o",
  // verbose: true, // 开启详细日志
});

console.log("OpenAI LLM 实例已创建");
