import { tool } from "@langchain/core/tools";
import z from "zod";
import { parseUserInstruction } from "../agents/planAgent";

// 适配器：只暴露 input，schema 固定在闭包里
export const createParserTool = (schema: z.ZodTypeAny) => {
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
