import { tool } from "@langchain/core/tools";
import z from "zod";
import readline from "readline";
import { model } from "../llms/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { MonitorTarget } from "../types/schema";
import { OutputParserException } from "@langchain/core/output_parsers";
// TODO 将tool prompt和监控任务解耦，可以适配任何任务
export const createParserTool = (schema: z.ZodTypeAny) => {
    // 适配器：只暴露 input，schema 固定在闭包里
  const adapter = async ({ input }: { input: string }) => {
    return await parseUserInstruction({ input, schema });
  };

  return tool(adapter, {
    name: "parse_user_instruction",
    description: "解析用户输入的监控指令，提取结构化的监控目标信息",
    schema: z.object({
      input: z.string().describe("用户输入的监控指令"),
    }),
  });
};

const PROMPT_INTRO = `你是一个监控调度助手，需要从用户输入中提取结构化的监控目标信息。

用户可能会以自然语言描述他们想监控的资产。请理解用户意图并提取关键信息。`;

const PROMPT_EXAMPLES = `示例输入:
"监控比特币价格，当超过50000美元时通知我，我的邮箱是example@email.com"
"帮我追踪特斯拉股票，如果低于150美元就提醒我,我的手机号是1234567890"
"帮我监控纳指100，价格高于20000点时通知我"
"我想知道当前的金价是否低于800元，每小时检查一次"`;

const PROMPT_RULES = `用户可能会前后调整监控频率或者监控目标，此时应该以最新的输入而不是历史输入为准
例如当前输入每20分钟监控，用户历史输入每5分钟监控，那么监控频率应该是20分钟一次而不是5分钟
例如当前输入苹果公司，用户历史输入特斯拉公司，那么监控目标应该是苹果公司而不是特斯拉公司`;

const PROMPT_GUIDELINES = `注意，如果type为stock，symbol需要你推断出数位大写字母的外汇/期货合约或单公司证券，例如特斯拉是TSLA，纳指为NQUSD。
如果type为crypto，symbol需要你推断出数位大写字母加密货币代码，例如比特币是BTC。
如果用户输入缺少必要信息，请在对应字段填写null，并返回请求用户提供更多信息。`;

// 追问
const parseUserInstruction = async (content: {
  input: string;
  schema: z.ZodTypeAny;
}): Promise<MonitorTarget> => {
  const { input, schema } = content;
  const parser = StructuredOutputParser.fromZodSchema(schema);

  const promptTemplate = `${PROMPT_INTRO}
    ${PROMPT_EXAMPLES}

    用户最新输入: {input}
    ${PROMPT_RULES}
    请提取关键信息并根据函数定义返回结构化数据: {format_instructions}。
    ${PROMPT_GUIDELINES}`;

  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables: ["input"],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  });

  const chain = prompt.pipe(model).pipe(parser);

  try {
    const res = await chain.invoke({ input });
    return res;
  } catch (err) {
    if (err instanceof OutputParserException) {
      const promptFollowup = `你刚才的监控指令中缺少关键信息，请补充这些信息（如价格阈值、触发方向、监控频率等）`;
      const userReply = await askUserInCli(promptFollowup);
      return await parseUserInstruction({
        input: userReply + "\n  用户历史输入: " + input,
        schema: schema,
      });
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

