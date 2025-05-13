import { tool } from "@langchain/core/tools";
import z from "zod";
import readline from "readline";
import { model } from "../llms/openai.ts";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { MonitorTarget } from "../types/schema.ts";
import { OutputParserException } from "@langchain/core/output_parsers";
// TODO 将tool prompt和监控任务解耦，可以适配任何任务
export const createParserTool = (schema: z.ZodTypeAny) => {
  // 适配器：只暴露 input，schema 固定在闭包里
  const adapter = async ({ input }: { input: string }) => {
    return await parseUserInstruction({ input, schema });
  };

  return tool(adapter, {
    name: "parse_user_instruction",
    description:
      "解析用户输入的监控指令提取成英文的结构化的监控目标信息,获取完后可以直接调用其他工具获取监控信息",
    schema: z.object({
      input: z.string().describe("用户输入的监控指令"),
    }),
  });
};

const PROMPT_INTRO = `你是一个监控调度助手，需要从用户输入中提取结构化的监控目标信息。

用户可能会以自然语言描述他们想监控的信息。请理解用户意图并提取关键信息。`;

const PROMPT_EXAMPLES = `示例输入:
"监控比特币价格，当超过50000美元时通知我，我的邮箱是example@email.com"
"每小时帮我查看一下北京的天气，如果下雨请提醒我"
"帮我监控纳指100，价格高于20000点时通知我"
"我想知道当前的金价是否低于800元，每小时检查一次"`;

const PROMPT_RULES = `用户可能会前后调整监控频率或者监控目标，此时应该以最新的输入而不是历史输入为准
例如当前输入每20分钟监控，用户历史输入每5分钟监控，那么监控频率应该是20分钟一次而不是5分钟
例如当前输入苹果公司，用户历史输入特斯拉公司，那么监控目标应该是苹果公司而不是特斯拉公司`;

const PROMPT_GUIDELINES = `
请将指令转换为适合浏览器询问的格式, 例如询问的是英伟达公司股票，command字段则应该是what is the stock price of Nvidia now
如果用户输入缺少必要信息，请在对应字段填写null，并返回请求用户提供更多信息。`;

// 追问
const parseUserInstruction = async (content: {
  input: string;
  schema: z.ZodTypeAny;
}): Promise<MonitorTarget> => {
  const { input, schema } = content;
  const parser = StructuredOutputParser.fromZodSchema(schema);

  const promptTemplate = `${PROMPT_INTRO}
    用户最新输入: {input}
    ${PROMPT_RULES}
    ${PROMPT_GUIDELINES}
    请提取关键信息并根据函数定义返回英文的结构化数据: {format_instructions}。
    `;

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
      const promptFollowup = `你刚才的监控指令中缺少关键信息，请补充这些信息（如监控阈值、触发方向、监控频率等）`;
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
