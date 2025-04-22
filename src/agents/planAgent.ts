// agents/planAgent.ts
import { llm } from "../llms/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { MonitorTarget, MonitorTargetSchema } from "../types/schema";
import { RunnableSequence } from "@langchain/core/runnables";

const parser = StructuredOutputParser.fromZodSchema(MonitorTargetSchema);

const prompt = new PromptTemplate({
  template: `你是一个监控调度助手，需要从用户输入中提取结构化的监控目标信息。

用户可能会以自然语言描述他们想监控的资产。请理解用户意图并提取关键信息。

示例输入:
"监控比特币价格，当超过50000美元时通知我，我的邮箱是example@email.com"
"帮我追踪特斯拉股票，如果低于150美元就提醒我,我的手机号是1234567890"
"帮我监控纳指100，价格高于20000点时通知我"
"我想知道当前的金价是否低于800元，每小时检查一次"

用户输入: {input}

请提取关键信息并根据函数定义返回结构化数据: {format_instructions}。
注意，如果type为stock，symbol需要你推断出数位大写字母的股票代码，例如特斯拉是TSLA。
如果type为crypto，symbol需要你推断出数位大写字母加密货币代码，例如比特币是BTC。
如果股票是纳指，代码为NQUSD而不是NQX。
如果用户输入缺少必要信息，请合理推断默认值。
如果你无法推断，请返回请求用户提供更多信息。
`,
  inputVariables: ["input"],
  partialVariables: { format_instructions: parser.getFormatInstructions() },
});

const chain = RunnableSequence.from([
  {
    input: (input: string) => ({ input }),
  },
  prompt,
  llm,
  parser,
]);

// 🧠 使用 LangChain 最新 API 对用户自然语言指令进行结构化解析
export const parseUserInstruction = async (
  input: string
): Promise<MonitorTarget> => {
  console.log("解析用户指令:", input);
  try {
    console.log("开始调用LLM...");
    const result = await chain.invoke(input);
    console.log("LLM调用成功，结果:", result);
    return result;
  } catch (error) {
    console.error("解析指令时发生错误:", error);
    throw error;
  }
};
