// graph/monitorGraph.ts
import { StateGraph, END, Annotation, Command } from "@langchain/langgraph";
import { parseUserInstruction } from "../agents/planAgent";
import { fetchMonitoredValue } from "../agents/fetchAgent";
import { shouldTriggerNotification } from "../agents/comparatorAgent";
import { notifyUser } from "../agents/notifyAgent";
import { MonitorTarget } from "../types/schema";
const StateAnnotation = Annotation.Root({
  content: Annotation<string>, // 消息内容
  target: Annotation<MonitorTarget>, // 监控目标
  current: Annotation<number>, // 当前值
  shouldNotify: Annotation<boolean>, // 是否需要通知
});

async function planNode(state : typeof StateAnnotation.State ){
  // 从消息中提取输入内容和元数据
  const { content} = state;
  const target = await parseUserInstruction(content);
  return {
    target
  };
};

async function fetchNode(state : typeof StateAnnotation.State ){
  const current = await fetchMonitoredValue(state.target);
  return { current };
};

async function compareNode(state : typeof StateAnnotation.State ){
  const shouldNotify = shouldTriggerNotification(state.target, state.current);
  return {
    shouldNotify,
  };
};

function checkCompare(state : typeof StateAnnotation.State ){
  return state.shouldNotify ? "Pass" : "Fail";
};

async function notifyNode(state : typeof StateAnnotation.State ){
    await notifyUser({
      method: state.target.notifyMethod,
      to: state.target.notifyAddress,
      content: `⚠️ ${state.target.symbol} 当前价格为 ${state.current}，已${
        state.target.direction === "above" ? "超过" : "低于"
      }你的设定阈值 ${state.target.threshold}`,
    });
  return state;
};

export const monitorGraph = () => {
  const graph = new StateGraph(StateAnnotation)
    .addNode("plan", planNode)
    .addNode("fetch", fetchNode)
    .addNode("compare", compareNode)
    .addNode("notify", notifyNode)
    .addEdge("__start__", "plan")
    .addEdge("plan", "fetch")
    .addEdge("fetch", "compare")
    .addConditionalEdges("compare", checkCompare, {
      Pass: "notify",
      Fail: "__end__"
    })
    .addEdge("notify", END);

  return graph.compile();
};
