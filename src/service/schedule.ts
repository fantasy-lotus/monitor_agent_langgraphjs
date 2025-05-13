import z from "zod";
import { model } from "../llms/openai.ts";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { MonitorTarget } from "../types/schema.ts";
import { OutputParserException } from "@langchain/core/output_parsers";

const PROMPT_INTRO = `你是一个监控调度助手，需要从用户输入中提取结构化的监控目标信息。

用户可能会以自然语言描述他们想监控的信息。请理解用户意图并提取关键信息。`;

const PROMPT_EXAMPLES = `示例输入:
"监控比特币价格，当超过50000美元时通知我，我的邮箱是example@email.com"
"每小时帮我查看一下北京的天气，如果下雨请提醒我"
"帮我监控纳指100，价格高于20000点时通知我"
"我想知道当前的金价是否低于800元，每小时检查一次"`;

const PROMPT_GUIDELINES = `
请将指令转换为适合浏览器询问的格式, 例如询问的是英伟达公司股票，command字段则应该是what is the stock price of Nvidia now
如果用户输入缺少必要信息，请在对应字段填写null，并返回请求用户提供更多信息。`;

export const parseUserInstruction = async (content: {
  input: string;
  schema: z.ZodTypeAny; //MoniterSchema, todo is adapt any schema
}): Promise<MonitorTarget | null> => {
  const { input, schema } = content;
  const parser = StructuredOutputParser.fromZodSchema(schema);

  const promptTemplate = `${PROMPT_INTRO}
    用户输入: {input}
    ${PROMPT_GUIDELINES}
    ${PROMPT_EXAMPLES}
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
      return null; //用户输入内容缺失
    }
    throw err;
  }
};
