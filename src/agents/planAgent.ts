// agents/planAgent.ts
import { model } from "../llms/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { MonitorTarget, MonitorTargetSchema } from "../types/schema";
import { RunnableSequence } from "@langchain/core/runnables";
import readline from "readline";
import { OutputParserException } from "@langchain/core/output_parsers";

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
用户可能会前后调整监控频率或者监控目标，此时应该1️以最新的输入而不是历史输入为准
例如当前输入每20分钟监控，用户历史输入每5分钟监控，那么监控频率应该是20分钟一次而不是5分钟
例如当前输入苹果公司，用户历史输入特斯拉公司，那么监控目标应该是苹果公司而不是特斯拉公司

请提取关键信息并根据函数定义返回结构化数据: {format_instructions}。
注意，如果type为stock，symbol需要你推断出数位大写字母的外汇/期货合约或单公司证券，例如特斯拉是TSLA，纳指为NQUSD。
如果type为crypto，symbol需要你推断出数位大写字母加密货币代码，例如比特币是BTC。
如果用户输入缺少必要信息，请在对应字段填写null，并返回请求用户提供更多信息。
`,
  inputVariables: ["input","context"],
  partialVariables: { format_instructions: parser.getFormatInstructions() },
});

const chain = RunnableSequence.from([
  {
    input: (input: string) => ({ input }),
  },
  prompt,
  model,
  parser,
]);

// 追问
export const parseUserInstruction = async (
  input: string,
  context: string[] = []
): Promise<MonitorTarget> => {
  try {
    const res = await chain.invoke(input + "\n用户历史输入: " + context);
    return res;
  } catch (err) {
    if (err instanceof OutputParserException) {
      const promptFollowup = `你刚才的监控指令中缺少关键信息，无法解析为结构化数据。
请补充这些信息（如价格阈值、触发方向、监控频率等）`;
      const userReply = await askUserInCli(promptFollowup);
      return await parseUserInstruction(userReply, [...context, input]);
    }
    throw err;
  }
};

const askUserInCli = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`🤖 ${question}\n> `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};
