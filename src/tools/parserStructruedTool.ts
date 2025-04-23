import { tool } from "@langchain/core/tools";
import { MonitorTargetSchema } from "../types/schema";
import { parseUserInstruction } from "../agents/planAgent";
import z from "zod";

export const createParserTool = tool(
    parseUserInstruction,
    {
        name: "parse_user_instruction",
        description: "解析用户输入的监控指令，提取结构化的监控目标信息",
        schema: z.object({
            input: z.string().describe("用户输入的监控指令"),
            output: MonitorTargetSchema.describe("解析后的结构化监控目标信息"),
        })
    }
)